package http

import (
	"context"
	"net/http"

	platform "github.com/influxdata/influxdb"
	"github.com/julienschmidt/httprouter"
	"go.uber.org/zap"
)

// SessionBackend is all services and associated parameters required to construct
// the SessionHandler.
type SessionBackend struct {
	Logger *zap.Logger
	platform.HTTPErrorHandler

	PasswordsService platform.PasswordsService
	SessionService   platform.SessionService
}

// NewSessionBackend creates a new SessionBackend with associated logger.
func NewSessionBackend(b *APIBackend) *SessionBackend {
	return &SessionBackend{
		HTTPErrorHandler: b.HTTPErrorHandler,
		Logger:           b.Logger.With(zap.String("handler", "session")),

		PasswordsService: b.PasswordsService,
		SessionService:   b.SessionService,
	}
}

// SessionHandler represents an HTTP API handler for authorizations.
type SessionHandler struct {
	*httprouter.Router
	platform.HTTPErrorHandler
	Logger *zap.Logger

	PasswordsService platform.PasswordsService
	SessionService   platform.SessionService
}

// NewSessionHandler returns a new instance of SessionHandler.
func NewSessionHandler(b *SessionBackend) *SessionHandler {
	h := &SessionHandler{
		Router:           NewRouter(b.HTTPErrorHandler),
		HTTPErrorHandler: b.HTTPErrorHandler,
		Logger:           b.Logger,

		PasswordsService: b.PasswordsService,
		SessionService:   b.SessionService,
	}

	h.HandlerFunc("POST", "/api/v2/signin", h.handleSignin)
	h.HandlerFunc("POST", "/api/v2/signout", h.handleSignout)
	return h
}

// handleSignin is the HTTP handler for the POST /signin route.
func (h *SessionHandler) handleSignin(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	req, err := decodeSigninRequest(ctx, r)
	if err != nil {
		UnauthorizedError(ctx, h, w)
		return
	}

	if err := h.PasswordsService.ComparePassword(ctx, req.Username, req.Password); err != nil {
		// Don't log here, it should already be handled by the service
		UnauthorizedError(ctx, h, w)
		return
	}

	s, e := h.SessionService.CreateSession(ctx, req.Username)
	if e != nil {
		UnauthorizedError(ctx, h, w)
		return
	}

	encodeCookieSession(w, s)
	w.WriteHeader(http.StatusNoContent)
}

type signinRequest struct {
	Username string
	Password string
}

func decodeSigninRequest(ctx context.Context, r *http.Request) (*signinRequest, *platform.Error) {
	u, p, ok := r.BasicAuth()
	if !ok {
		return nil, &platform.Error{
			Code: platform.EInvalid,
			Msg:  "invalid basic auth",
		}
	}

	return &signinRequest{
		Username: u,
		Password: p,
	}, nil
}

// handleSignout is the HTTP handler for the POST /signout route.
func (h *SessionHandler) handleSignout(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	req, err := decodeSignoutRequest(ctx, r)
	if err != nil {
		UnauthorizedError(ctx, h, w)
		return
	}

	if err := h.SessionService.ExpireSession(ctx, req.Key); err != nil {
		UnauthorizedError(ctx, h, w)
		return
	}

	// TODO(desa): not sure what to do here maybe redirect?
	w.WriteHeader(http.StatusNoContent)
}

type signoutRequest struct {
	Key string
}

func decodeSignoutRequest(ctx context.Context, r *http.Request) (*signoutRequest, *platform.Error) {
	key, err := decodeCookieSession(ctx, r)
	if err != nil {
		return nil, err
	}
	return &signoutRequest{
		Key: key,
	}, nil
}

const cookieSessionName = "session"

func encodeCookieSession(w http.ResponseWriter, s *platform.Session) {
	c := &http.Cookie{
		Name:  cookieSessionName,
		Value: s.Key,
	}

	http.SetCookie(w, c)
}
func decodeCookieSession(ctx context.Context, r *http.Request) (string, *platform.Error) {
	c, err := r.Cookie(cookieSessionName)
	if err != nil {
		return "", &platform.Error{
			Err:  err,
			Code: platform.EInvalid,
		}
	}
	return c.Value, nil
}

// SetCookieSession adds a cookie for the session to an http request
func SetCookieSession(key string, r *http.Request) {
	c := &http.Cookie{
		Name:  cookieSessionName,
		Value: key,
	}

	r.AddCookie(c)
}

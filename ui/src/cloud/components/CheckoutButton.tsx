import React, {FunctionComponent} from 'react'

// Components
import {FeatureFlag} from 'src/shared/utils/featureFlag'
import {
  Button,
  ComponentColor,
  ComponentSize,
  ComponentSpacer,
  FlexDirection,
  JustifyContent,
} from '@influxdata/clockface'

// Constants
import {CLOUD_CHECKOUT_PATH, CLOUD_URL} from 'src/shared/constants'

const CheckoutButton: FunctionComponent<{}> = () => {
  const checkoutURL = `${CLOUD_URL}${CLOUD_CHECKOUT_PATH}`
  const onClick = () => (window.location.href = checkoutURL)

  return (
    <FeatureFlag name="cloudBilling">
      <ComponentSpacer
        direction={FlexDirection.Row}
        justifyContent={JustifyContent.SpaceAround}
        margin={ComponentSize.Small}
      >
        <div>Want to remove these limits?</div>
        <Button
          color={ComponentColor.Primary}
          onClick={onClick}
          text="Upgrade Now"
          size={ComponentSize.Small}
        />
      </ComponentSpacer>
    </FeatureFlag>
  )
}

export default CheckoutButton

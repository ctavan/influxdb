import {
  labelToRelationship,
  labelToIncluded,
  taskToTemplate,
  variableToTemplate,
  dashboardToTemplate,
} from 'src/shared/utils/resourceToTemplate'
import {TemplateType} from '@influxdata/influx'
import {createVariable} from 'src/variables/mocks'
import {
  myDashboard,
  myView,
  myVariable,
  myfavelabel,
  myfavetask,
} from 'src/shared/utils/mocks/resourceToTemplate'

describe('resourceToTemplate', () => {
  describe('labelToRelationship', () => {
    it('converts a label to a relationship struct', () => {
      const actual = labelToRelationship(myfavelabel)
      const expected = {type: TemplateType.Label, id: myfavelabel.id}

      expect(actual).toEqual(expected)
    })
  })

  describe('labelToIncluded', () => {
    it('converts a label to a data structure in included', () => {
      const actual = labelToIncluded(myfavelabel)
      const expected = {
        type: TemplateType.Label,
        id: myfavelabel.id,
        attributes: {
          name: myfavelabel.name,
          properties: {
            color: myfavelabel.properties.color,
            description: myfavelabel.properties.description,
          },
        },
      }

      expect(actual).toEqual(expected)
    })
  })

  describe('variableToTemplate', () => {
    it('converts a variable with dependencies to a template', () => {
      const a = {
        ...createVariable('a', 'x.b + 1'),
        labels: [myfavelabel],
      }
      const b = createVariable('b', '9000')
      const dependencies = [a, b]

      const actual = variableToTemplate(myVariable, dependencies)

      const expected = {
        meta: {
          version: '1',
          name: 'beep-Template',
          type: 'variable',
          description: 'template created from variable: beep',
        },
        content: {
          data: {
            type: 'variable',
            id: '039ae3b3b74b0000',
            attributes: {
              name: 'beep',
              arguments: {
                type: 'query',
                values: {
                  query: 'f(x: v.a)',
                  language: 'flux',
                },
              },
              selected: null,
            },
            relationships: {
              variable: {
                data: [
                  {
                    id: 'a',
                    type: 'variable',
                  },
                  {
                    id: 'b',
                    type: 'variable',
                  },
                ],
              },
              label: {
                data: [],
              },
            },
          },
          included: [
            {
              type: 'variable',
              id: 'a',
              attributes: {
                name: 'a',
                arguments: {
                  type: 'query',
                  values: {
                    query: 'x.b + 1',
                    language: 'flux',
                  },
                },
                selected: [],
              },
              relationships: {
                label: {
                  data: [
                    {
                      type: 'label',
                      id: '1',
                    },
                  ],
                },
              },
            },
            {
              type: 'variable',
              id: 'b',
              attributes: {
                name: 'b',
                arguments: {
                  type: 'query',
                  values: {
                    query: '9000',
                    language: 'flux',
                  },
                },
                selected: [],
              },
              relationships: {
                label: {
                  data: [],
                },
              },
            },
            {
              id: '1',
              type: 'label',
              attributes: {
                name: '1label',
                properties: {color: 'fffff', description: 'omg'},
              },
            },
          ],
        },
        labels: [],
      }

      expect(actual).toEqual(expected)
    })
  })

  describe('taskToTemplate', () => {
    it('converts a task to a template', () => {
      const actual = taskToTemplate(myfavetask)
      const expected = {
        content: {
          data: {
            type: 'task',
            attributes: {
              every: '24h0m0s',
              flux:
                'option task = {name: "lala", every: 24h0m0s, offset: 1m0s}\n\nfrom(bucket: "defnuck")\n\t|> range(start: -task.every)',
              name: 'lala',
              offset: '1m0s',
              status: 'active',
            },
            relationships: {
              label: {
                data: [
                  {
                    id: '037b0c86a92a2000',
                    type: 'label',
                  },
                ],
              },
            },
          },
          included: [
            {
              attributes: {
                name: 'yum',
                properties: {
                  color: '#FF8564',
                  description: '',
                },
              },
              id: '037b0c86a92a2000',
              type: TemplateType.Label,
            },
          ],
        },
        labels: [],
        meta: {
          description: 'template created from task: lala',
          name: 'lala-Template',
          type: 'task',
          version: '1',
        },
      }

      expect(actual).toEqual(expected)
    })
  })

  describe('dashboardToTemplate', () => {
    it('can convert a dashboard to template', () => {
      const myLabeledVar = {
        ...createVariable('var_1', 'labeled var!'),
        labels: [myfavelabel],
      }

      const dashboardWithDupeLabel = {
        ...myDashboard,
        labels: [myfavelabel],
      }

      const actual = dashboardToTemplate(
        dashboardWithDupeLabel,
        [myView],
        [myLabeledVar]
      )

      const expected = {
        meta: {
          version: '1',
          name: 'MyDashboard-Template',
          type: 'dashboard',
          description: 'template created from dashboard: MyDashboard',
        },
        content: {
          data: {
            type: 'dashboard',
            attributes: {
              name: 'MyDashboard',
              description: '',
            },
            relationships: {
              label: {
                data: [
                  {
                    id: '1',
                    type: 'label',
                  },
                ],
              },
              cell: {
                data: [
                  {
                    type: 'cell',
                    id: 'cell_view_1',
                  },
                ],
              },
              variable: {
                data: [
                  {
                    type: 'variable',
                    id: 'var_1',
                  },
                ],
              },
            },
          },
          included: [
            {
              id: '1',
              type: 'label',
              attributes: {
                name: '1label',
                properties: {color: 'fffff', description: 'omg'},
              },
            },
            {
              id: 'cell_view_1',
              type: 'cell',
              attributes: {
                x: 0,
                y: 0,
                w: 4,
                h: 4,
              },
              relationships: {
                view: {
                  data: {
                    type: 'view',
                    id: 'cell_view_1',
                  },
                },
              },
            },
            {
              type: 'view',
              id: 'cell_view_1',
              attributes: {
                name: 'My Cell',
                properties: {
                  shape: 'chronograf-v2',
                  queries: [
                    {
                      text: 'v.bucket',
                      editMode: 'advanced',
                      name: 'View Query',
                      builderConfig: {
                        buckets: [],
                        tags: [
                          {
                            key: '_measurement',
                            values: [],
                          },
                        ],
                        functions: [],
                        aggregateWindow: {period: 'auto'},
                      },
                    },
                  ],
                  axes: {
                    x: {
                      bounds: ['', ''],
                      label: '',
                      prefix: '',
                      suffix: '',
                      base: '10',
                      scale: 'linear',
                    },
                    y: {
                      bounds: ['', ''],
                      label: '',
                      prefix: '',
                      suffix: '',
                      base: '10',
                      scale: 'linear',
                    },
                  },
                  type: 'xy',
                  legend: {},
                  geom: 'line',
                  colors: [],
                  note: '',
                  showNoteWhenEmpty: false,
                  xColumn: null,
                  yColumn: null,
                },
              },
            },
            {
              type: 'variable',
              id: 'var_1',
              attributes: {
                name: 'var_1',
                arguments: {
                  type: 'query',
                  values: {
                    query: 'labeled var!',
                    language: 'flux',
                  },
                },
                selected: [],
              },
              relationships: {
                label: {
                  data: [
                    {
                      type: 'label',
                      id: '1',
                    },
                  ],
                },
              },
            },
          ],
        },
        labels: [],
      }

      expect(actual).toEqual(expected)
    })
  })
})

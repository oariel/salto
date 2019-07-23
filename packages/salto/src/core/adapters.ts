import SalesforceAdapter from 'salesforce-adapter'
import {
  InstanceElement, Element, ObjectType, isInstanceElement, ElemID,
} from 'adapter-api'

export interface Adapter {
  getConfigType(): ObjectType
  init(config: InstanceElement): void
  discover(): Promise<Element[]>
  add(element: ObjectType): Promise<ObjectType>
  remove(element: Element): Promise<void>
  update(before: ObjectType, after: ObjectType): Promise<ObjectType>
}

export const init = async (elements: Element[], fillConfig: (t: ObjectType) =>
  Promise<InstanceElement>): Promise<[Record<string, Adapter>, InstanceElement[]]> => {
  const adapters: Record<string, Adapter> = { salesforce: new SalesforceAdapter() }
  const configs = elements.filter(element => isInstanceElement(element)
    && element.elemID.name === ElemID.CONFIG_INSTANCE_NAME) as InstanceElement[]
  const newConfigs: InstanceElement[] = []

  Object.values(adapters).forEach(async adapter => {
    let config = configs.find(e => e.type.elemID.adapter === adapter.getConfigType().elemID.adapter)
    if (!config) {
      config = await fillConfig(adapter.getConfigType())
      newConfigs.push(config)
    }
    adapter.init(config)
  })

  return [adapters, newConfigs]
}
/*
*                      Copyright 2020 Salto Labs Ltd.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with
* the License.  You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
import { ElemID, ServiceIds } from '@salto-io/adapter-api'
import SalesforceClient, { Credentials } from '../src/client/client'
import SalesforceAdapter, { SalesforceAdapterParams } from '../src/adapter'

export type Reals = {
  client: SalesforceClient
  adapter: SalesforceAdapter
}

export type Opts = {
  adapterParams?: Partial<SalesforceAdapterParams>
  credentials: Credentials
}
const mockGetElemIdFunc = (adapterName: string, _serviceIds: ServiceIds, name: string):
  ElemID => new ElemID(adapterName, name)

const realAdapter = ({ adapterParams, credentials }: Opts): Reals => {
  const client = (adapterParams && adapterParams.client) || new SalesforceClient({ credentials })
  const adapter = new SalesforceAdapter({
    client,
    config: {},
    ...adapterParams || { getElemIdFunc: mockGetElemIdFunc },
  })
  return { client, adapter }
}

export default realAdapter

//Polyfill TextEncoder, TextDecoder
import { TextEncoder, TextDecoder } from 'util'
/* eslint-disable  @typescript-eslint/no-explicit-any */
global.TextEncoder = TextEncoder as any
/* eslint-disable  @typescript-eslint/no-explicit-any */
global.TextDecoder = TextDecoder as any


import { Controller } from "ipfsd-ctl"
import { createConnectedNodes, createOwnFactory } from "./utils"
jest.setTimeout(1 * 60 * 1000)

let nodes: Controller[]
const factory = createOwnFactory()
beforeAll(async () => {
    nodes = await createConnectedNodes(factory, 2)
})

afterAll(async () => {
    await factory.clean()
})


it('createConnectedNode count', async () => {
    expect(nodes.length).toEqual(2)
})

it('createConnectedNode check peers', async () => {
    const node0addrs = await nodes[0].api.swarm.addrs()
    const node1addrs = await nodes[1].api.swarm.addrs()

    const node0id = await nodes[0].api.id()
    const node1id = await nodes[1].api.id()

    expect(node0addrs).toHaveLength(1)
    expect(node0addrs.find(addr => addr.id === node1id.id))

    expect(node1addrs).toHaveLength(1)
    expect(node1addrs.find(addr => addr.id === node0id.id))
})
//Polyfill TextEncoder, TextDecoder
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder as any
global.TextDecoder = TextDecoder as any

import Room from '../room'
import { nanoid } from 'nanoid'
import { createConnectedNodes, createOwnFactory, waitFor } from './utils'
import { Controller } from 'ipfsd-ctl';


jest.setTimeout(5 * 60 * 1000)

let nodes: Controller[];
let factory = createOwnFactory()


beforeEach(async () => {
    nodes = await createConnectedNodes(factory, 3)
})

afterEach(async () => {
    await factory.clean()
})

it('test getPeers', async () => {
    const [ipfs0, ipfs1, ipfs2] = nodes
    const roomName = 'Test' + nanoid()

    const room0 = new Room(ipfs0.api, roomName)
    const room1 = new Room(ipfs1.api, roomName)
    const room2 = new Room(ipfs2.api, roomName)

    await room0.join()
    await room1.join()
    await room2.join()

    expect(await room0.getPeers()).toHaveLength(2)
    expect(await room1.getPeers()).toHaveLength(2)
    expect(await room2.getPeers()).toHaveLength(2)

    await room0.leave()
    await room1.leave()
    await room2.leave()
})

it('test onPeerJoined', async () => {
    const mock = jest.fn()
    const [ipfs0, ipfs1] = nodes
    const roomName = 'Test' + nanoid()

    const ipfs1Id = await ipfs1.api.id()
    const room0 = new Room(ipfs0.api, roomName)
    const room1 = new Room(ipfs1.api, roomName)

    await room0.join()
    await room1.join()

    room0.onPeerJoined(mock)

    await waitFor(1)
    expect(mock).toBeCalledWith(ipfs1Id.id)

    await room0.leave()
    await room1.leave()
})

it('test onPeerJoined multiple rooms', async () => {
    const mock = jest.fn()

    const [ipfs0, ipfs1] = nodes
    const roomName0 = 'Test' + nanoid()
    const roomName1 = 'Test' + nanoid()

    const room00 = new Room(ipfs0.api, roomName0)
    const room01 = new Room(ipfs0.api, roomName1)

    const room10 = new Room(ipfs1.api, roomName0)
    const room11 = new Room(ipfs1.api, roomName1)

    room00.onPeerJoined(mock)
    room01.onPeerJoined(mock)

    await room00.join()
    await room01.join()

    await room10.join()
    await room11.join()

    await waitFor(1)
    expect(mock).toBeCalledTimes(2);

    await room00.leave()
    await room01.leave()
    await room10.leave()
    await room11.leave()
})

it('test onDirectMessage', async () => {
    const mock1 = jest.fn()

    const [ipfs0, ipfs1] = nodes
    const roomName = 'Test' + nanoid()

    const ipfs1Id = await ipfs1.api.id()

    const room0 = new Room(ipfs0.api, roomName)
    const room1 = new Room(ipfs1.api, roomName)
    room1.onDirectMessage(mock1)

    await room0.join()
    await room1.join()

    await room0.sendMessageToPeer("test", ipfs1Id.id)
    await room0.sendMessageToPeer("test", ipfs1Id.id)
    await room0.sendMessageToPeer("test", ipfs1Id.id)

    await waitFor(1)
    expect(mock1).toBeCalledTimes(3);

    await room0.leave()
    await room1.leave()
})

it('test onDirectMessage 1', async () => {
    const mock1 = jest.fn()

    const [ipfs0, ipfs1] = nodes
    const roomName = 'Test' + nanoid()

    const ipfs1Id = await ipfs1.api.id()

    const room0 = new Room(ipfs0.api, roomName)
    const room1 = new Room(ipfs1.api, roomName)
    room1.onDirectMessage(mock1)

    await room0.join()
    await room1.join()

    await room0.sendMessageToPeer("test", ipfs1Id.id, ipfs1Id.id, ipfs1Id.id)

    await waitFor(1)
    expect(mock1).toBeCalledTimes(3);

    await room0.leave()
    await room1.leave()
})

it('test onDirectMessage 2', async () => {
    const mock = jest.fn()

    const [ipfs0, ipfs1, ipfs2] = nodes
    const roomName = 'Test' + nanoid()

    const ipfs0Id = await ipfs0.api.id()
    const ipfs1Id = await ipfs1.api.id()
    const ipfs2Id = await ipfs2.api.id()

    //Room 0 Setup
    const room0 = new Room(ipfs0.api, roomName)
    room0.onDirectMessage(mock)

    //Room 1 Setup
    const room1 = new Room(ipfs1.api, roomName)
    room1.onDirectMessage(mock)

    //Room 2 Setup
    const room2 = new Room(ipfs2.api, roomName)
    room2.onDirectMessage(mock)


    await room0.join()
    await room1.join()
    await room2.join()


    await room0.sendMessageToPeer("test1", ipfs1Id.id)
    await room0.sendMessageToPeer("test2", ipfs2Id.id)

    await room1.sendMessageToPeer("test3", ipfs0Id.id)
    await room1.sendMessageToPeer("test4", ipfs2Id.id)

    await room2.sendMessageToPeer("test5", ipfs0Id.id)
    await room2.sendMessageToPeer("test6", ipfs1Id.id)


    await waitFor(1)
    expect(mock).toBeCalledTimes(6);

    await room0.leave()
    await room1.leave()
    await room2.leave()
})

it('test sendMessage to multiple', async () => {
    const mock = jest.fn()

    const [ipfs0, ipfs1, ipfs2] = nodes
    const roomName = 'Test' + nanoid()

    const room0 = new Room(ipfs0.api, roomName)
    const room1 = new Room(ipfs1.api, roomName)
    const room2 = new Room(ipfs2.api, roomName)

    room0.onMessage(mock)
    room1.onMessage(mock)
    room2.onMessage(mock)

    await room0.join()
    await room1.join()
    await room2.join()

    await room0.sendMessage("test")


    await waitFor(1)
    expect(mock).toBeCalledTimes(2);

    await room0.leave()
    await room1.leave()
    await room2.leave()
})

it('test peer left', async () => {
    const mock = jest.fn()

    const [ipfs0, ipfs1, ipfs2] = nodes
    const roomName = 'Test' + nanoid()

    const room0 = new Room(ipfs0.api, roomName)
    const room1 = new Room(ipfs1.api, roomName)
    const room2 = new Room(ipfs2.api, roomName)

    room0.onPeerLeft(mock)

    await room0.join()
    await room1.join()
    await room2.join()

    await waitFor(1)

    await room1.leave()
    await room2.leave()

    await waitFor(1)
    expect(mock).toBeCalledTimes(2)

    await room0.leave()
})
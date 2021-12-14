import { Controller, createFactory, Factory } from "ipfsd-ctl";
import { isNode } from 'ipfs-utils/src/env'

export const createOwnFactory = () => createFactory(
    {
        type: 'js',
        test: true,
        disposable: true,
        ipfsModule: require('ipfs-core'),
        ipfsBin: isNode ? require('ipfs').path() : undefined,
        ipfsHttpModule: require('ipfs-http-client'),
        ipfsOptions: {
            config: {
                Addresses: {
                    API: '/ip4/127.0.0.1/tcp/0',
                    Gateway: '/ip4/127.0.0.1/tcp/0',
                    RPC: '/ip4/127.0.0.1/tcp/0',
                },
                Bootstrap: []
            }
        }
    }
)

export async function createConnectedNodes(factory: Factory, count: number) {
    const nodes: Controller[] = []

    for (let i = 0; i < count; i++) {
        nodes.push(await factory.spawn())
    }

    for (let node of nodes) {
        const nodeId = await node.api.id()
        for (let peer of nodes) {
            const peerId = await peer.api.id()
            if (nodeId.id !== peerId.id)
                await node.api.swarm.connect(peerId.addresses[0])
        }
    }

    return nodes
}

export function toBePartialCalled<T extends object>(done: jest.DoneCallback, expected: Partial<T>) {
    return (data: T) => {
        try {
            for (let prop in expected) {
                expect(data[prop]).toEqual(expected[prop])
            }
        } catch (error) {
            done(error);
        }
    }
}

export function waitFor(s: number) {
    return new Promise(resolve => setTimeout(resolve, s * 1000))
}
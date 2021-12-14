import EventEmitter from 'events'
import * as IPFS from 'ipfs-core'

import { Events, Messages, Options } from './types';
import { decode, encode } from './utils';
import { Message } from 'ipfs-core-types/src/pubsub'


export default class Room {
    protected _emitter = new EventEmitter()

    protected _joined = false;

    constructor(
        protected readonly _ipfs: IPFS.IPFS,
        protected readonly _name: string,
        protected readonly _options?: Options,
    ) {
    }

    //Easy getters
    public get name() {
        return this._name
    }

    protected get pubsub() {
        return this._ipfs.pubsub
    }

    public async ipfsId() {
        return await (await (this._ipfs.id())).id
    }

    public peerChannel(peer: string) {
        return this._name + "/members/" + peer;
    }

    public async join() {
        if (this._joined)
            return

        const ipfsId = await this._ipfs.id()

        await this.pubsub.subscribe(this._name, (message) => {
            if (message.from !== ipfsId.id) {
                this.emitMessage(message)
            }
        })

        await this.pubsub.subscribe(this.peerChannel(ipfsId.id), (message) => {
            if (message.from !== ipfsId.id)
                this.emitDirectMessage(message)
        })

        await this.sendMessage(Messages.PeerJoin)

        this._joined = true
    }

    public async leave() {
        if (!this._joined)
            return

        await this.sendMessage(Messages.PeerLeave)

        const id = (await this._ipfs.id()).id

        await this.pubsub.unsubscribe(this._name)
        await this.pubsub.unsubscribe(this.peerChannel(id))

        this._emitter.removeAllListeners()
        this._joined = false
    }

    public async hasPeer(peer: string): Promise<boolean> {
        const peers = await this.getPeers()
        return peers.includes(peer)
    }

    public getPeers(): Promise<string[]> {
        return this._ipfs.pubsub.peers(this._name)
    }


    //Emitter
    private emitMessage(message: Message) {
        const decoded = decode(message.data);
        if (decoded === Messages.PeerJoin)
            return this.emitPeerJoined(message.from)
        if (decoded === Messages.PeerLeave)
            return this.emitPeerLeft(message.from)

        return this._emitter.emit(Events.Message, message)
    }

    private emitDirectMessage(message: Message) {
        this._emitter.emit(Events.DirectMessage, message)
    }

    private emitPeerJoined(peer: string) {
        return this._emitter.emit(Events.PeerJoined, peer)
    }

    private emitPeerLeft(peer: string) {
        return this._emitter.emit(Events.PeerLeft, peer)
    }


    //Ons
    public onMessage(handler: (message: Message) => void) {
        this._emitter.on(Events.Message, handler)
    }

    public onDirectMessage(handler: (message: Message) => void) {
        this._emitter.on(Events.DirectMessage, handler)
    }

    public onPeerJoined(handler: (peer: string) => void) {
        this._emitter.on(Events.PeerJoined, handler)
    }

    public onPeerLeft(handler: (peer: string) => void) {
        this._emitter.on(Events.PeerLeft, handler)
    }



    //send
    public async sendMessageToPeer(message: string, ...peers: string[]) {
        const encoded = encode(message)
        for (let peer of peers) {
            await this.pubsub.publish(this.peerChannel(peer), encoded)
        }
    }

    public async sendMessage(message: string) {
        await this.pubsub.publish(this.name, encode(message))
    }
}
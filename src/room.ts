import EventEmitter from 'events'
import * as IPFS from 'ipfs-core'

import { Events, Messages, Options } from './types';
import { decode, encode } from './utils';
import { Message } from 'ipfs-core-types/src/pubsub'
import { API as PubSubAPI } from 'ipfs-core-types/src/pubsub'



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
    public get name(): string {
        return this._name
    }

    protected get pubsub(): PubSubAPI {
        return this._ipfs.pubsub
    }

    public async ipfsId(): Promise<string> {
        return (await (this._ipfs.id())).id
    }

    public peerChannel(peer: string): string {
        return this._name + "/members/" + peer;
    }

    public async join(): Promise<void> {
        if (this._joined)
            return

        const ipfsId = await this._ipfs.id()

        await this.pubsub.subscribe(this._name, (message: Message) => {
            if (message.from !== ipfsId.id) {
                this.emitMessage(message)
            }
        })

        await this.pubsub.subscribe(this.peerChannel(ipfsId.id), (message: Message) => {
            if (message.from !== ipfsId.id)
                this.emitDirectMessage(message)
        })

        await this.sendMessage(Messages.PeerJoin)

        this._joined = true
    }

    public async leave(): Promise<void> {
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
    private emitMessage(message: Message): boolean {
        const decoded = decode(message.data);
        if (decoded === Messages.PeerJoin)
            return this.emitPeerJoined(message.from)
        if (decoded === Messages.PeerLeave)
            return this.emitPeerLeft(message.from)

        return this._emitter.emit(Events.Message, message)
    }

    private emitDirectMessage(message: Message): boolean {
        return this._emitter.emit(Events.DirectMessage, message)
    }

    private emitPeerJoined(peer: string): boolean {
        return this._emitter.emit(Events.PeerJoined, peer)
    }

    private emitPeerLeft(peer: string): boolean {
        return this._emitter.emit(Events.PeerLeft, peer)
    }


    //Ons
    public onMessage(handler: (message: Message) => void): void {
        this._emitter.on(Events.Message, handler)
    }

    public onDirectMessage(handler: (message: Message) => void): void {
        this._emitter.on(Events.DirectMessage, handler)
    }

    public onPeerJoined(handler: (peer: string) => void): void {
        this._emitter.on(Events.PeerJoined, handler)
    }

    public onPeerLeft(handler: (peer: string) => void): void {
        this._emitter.on(Events.PeerLeft, handler)
    }



    //send
    public async sendMessageToPeer(message: string, ...peers: string[]): Promise<void> {
        const encoded = encode(message)
        for (const peer of peers) {
            await this.pubsub.publish(this.peerChannel(peer), encoded)
        }
    }

    public async sendMessage(message: string): Promise<void> {
        await this.pubsub.publish(this.name, encode(message))
    }
}
export type Options = {
}

export enum Events {
    PeerJoined = 'peer_joined',
    PeerLeft = 'peer_left',
    Message = 'message',
    DirectMessage = 'direct message',
}

export enum Messages {
    PeerJoin = 'peer_join',
    PeerLeave = 'peer_leave',
}
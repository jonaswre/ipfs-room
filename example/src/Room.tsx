import { Col, Container, Row } from "react-bootstrap";
import { Room as IPFSRoom } from "ipfs-room"
import React, { useReducer, useState } from "react";

export function Room(props: { room: IPFSRoom }) {
    function reducer(state: string[], action: any) {
        switch (action.type) {
            case 'set':
                return [...action.payload]
            case 'join':
                return [...state, action.payload]
            case 'leave':
                return [...state.filter(peer => peer !== action.payload)]
            case 'clear':
                return []
            default:
                return state
        }
    }

    const [state, dispatch] = useReducer(reducer, ['test']);

    const dispatchSet = (peers: string[]) => dispatch({ type: 'set', payload: peers })
    const dispatchJoin = (peer: string) => dispatch({ type: 'join', payload: peer })
    const dispatchLeave = (peer: string) => dispatch({ type: 'leave', payload: peer })
    const dispatchClear = (peer: string) => dispatch({ type: 'clear' })





    React.useEffect(() => {
        props.room.onPeerJoined(peer => dispatchJoin(peer))
        props.room.onPeerLeft(peer => dispatchLeave(peer))

        const f = async () => {
            await props.room.join()
            const peers = await props.room.getPeers()
            dispatchSet(peers)
            console.log(peers)
        }
        f()
    }, [])

    return (
        <Container>
            <Row>
                <Col>
                    {state.map((i, s) => (<Row key={i}>{s}</Row>))}
                </Col>
                <Col>2</Col>
            </Row>
        </Container>
    )
}
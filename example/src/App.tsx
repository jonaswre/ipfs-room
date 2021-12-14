import React, { useRef, useState } from 'react';
import './App.css';
import { Room as IPFSRoom } from 'ipfs-room'
import { create, IPFS } from 'ipfs-core'
import { Button, Col, Container, Form, InputGroup, Navbar, Row } from 'react-bootstrap';
import { Room } from './Room';

function App() {
  let node = useRef<IPFS>()
  const [getRoom, setRoom] = useState<IPFSRoom>()
  const [getId, setId] = useState<string>('')
  const [getRoomName, setRoomName] = useState<string>('')

  const handleChange = (event: any) => {
    setRoomName(event.target.value);
  }

  const handleSubmit = (event: any) => {
    if (node.current && getRoomName) {
      setRoom(new IPFSRoom(node.current, getRoomName))
    }
    event.preventDefault();
  }

  React.useEffect(() => {
    create({
      repo: String(Math.random() + Date.now()),
    }).then(ipfs => {
      node.current = ipfs
      ipfs.id().then(id => setId(id.id))
    })
  }, [])

  return (<>
    <Navbar bg="dark" variant="dark">
      <Container>
        <Navbar.Brand>IPFS Room</Navbar.Brand>
        <Navbar.Text>
          IPFS: {getId}
        </Navbar.Text>

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Form.Control placeholder="Room Name" value={getRoomName} onChange={handleChange} />
            <Button variant="primary" type="submit">{getRoom ? 'Connected' : 'Connect'}</Button>
          </InputGroup>
        </Form>
      </Container>
    </Navbar>
    {getRoom && <Room room={getRoom} />}
  </>

  );
}

export default App;

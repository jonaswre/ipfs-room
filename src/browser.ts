/**
 * This file is the entrypoint of browser builds.
 * The code executes when loaded in a browser.
 */
import Room from "./room"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).ipfs_room = Room  // instead of casting window to any, you can extend the Window interface: https://stackoverflow.com/a/43513740/5433572

console.log('Method "ipfs_room" was added to the window object.')

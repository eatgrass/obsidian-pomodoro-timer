let running: boolean = false

const sendTick = (): void => {
    if (running) {
        self.postMessage(new Date().getTime())
        requestAnimationFrame(sendTick)
    }
}

self.onmessage = async ({ data }) => {
    if (data) {
        if (!running) {
            running = true
            sendTick()
        }
    } else {
        running = false
    }
}

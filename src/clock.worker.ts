let running: boolean = false

const tick = (): void => {
    if (running) {
        self.postMessage(new Date().getTime())
        requestAnimationFrame(tick)
    }
}

self.onmessage = async ({ data }) => {
    if (data) {
        if (!running) {
            running = true
            tick()
        }
    } else {
        running = false
    }
}
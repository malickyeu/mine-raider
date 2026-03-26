/* ── input.js ── keyboard + pointer-lock mouse input ── */

const keys = {};
let mouseDX = 0;
let pointerLocked = false;

export function initInput(canvas) {
    window.addEventListener('keydown', e => { keys[e.code] = true; });
    window.addEventListener('keyup',   e => { keys[e.code] = false; });

    canvas.addEventListener('click', () => {
        if (!pointerLocked) canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
        pointerLocked = document.pointerLockElement === canvas;
    });

    document.addEventListener('mousemove', e => {
        if (pointerLocked) {
            mouseDX += e.movementX;
        }
    });
}

export function isDown(code) {
    return !!keys[code];
}

export function consumeMouseDX() {
    const v = mouseDX;
    mouseDX = 0;
    return v;
}

export function isPointerLocked() {
    return pointerLocked;
}

export function releasePointer() {
    if (pointerLocked) document.exitPointerLock();
}

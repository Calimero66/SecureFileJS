document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('btnRefresh').addEventListener('click', () => location.reload());
    document.getElementById('btnDivEncrypt').addEventListener('click', () => showDiv('divEncryptfile'));
    document.getElementById('btnDivDecrypt').addEventListener('click', () => showDiv('divDecryptfile'));

    // Show encryption div by default
    showDiv('divEncryptfile');
});

function showDiv(divId) {
    document.getElementById('divEncryptfile').classList.add('d-none');
    document.getElementById('divDecryptfile').classList.add('d-none');
    document.getElementById(divId).classList.remove('d-none');
}

function encvalidate() {
    const passphrase = document.getElementById('txtEncpassphrase').value;
    const retype = document.getElementById('txtEncpassphraseretype').value;
    const match = passphrase === retype && passphrase.length >= 8;
    document.getElementById('btnEncrypt').disabled = !match;
    document.getElementById('spnCheckretype').innerText = match ? 'Passwords match' : '';
}

function decvalidate() {
    const passphrase = document.getElementById('txtDecpassphrase').value;
    document.getElementById('btnDecrypt').disabled = passphrase.length < 8;
}

function selectfile(files) {
    const file = files[0];
    if (file) {
        document.getElementById('spnencfilename').innerText = file.name;
        document.getElementById('spndecfilename').innerText = file.name;
    }
}

function drop_handler(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    selectfile(files);
}

function dragover_handler(event) {
    event.preventDefault();
}

function dragend_handler(event) {
    event.preventDefault();
}

async function encryptfile() {
    const passphrase = document.getElementById('txtEncpassphrase').value;
    const file = document.getElementById('encfileElem').files[0];

    if (!file || passphrase.length < 8) return;

    const fileData = await file.arrayBuffer();
    const keyMaterial = await getKeyMaterial(passphrase);
    const key = await getKey(keyMaterial, 'encrypt');
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const encryptedContent = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv: iv },
        key,
        fileData
    );

    const blob = new Blob([iv, new Uint8Array(encryptedContent)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.getElementById('aEncsavefile');
    a.href = url;
    a.download = `${file.name}.enc`;
    a.classList.remove('d-none');
    document.getElementById('spnEncstatus').innerText = 'File encrypted successfully';
}

async function decryptfile() {
    const passphrase = document.getElementById('txtDecpassphrase').value;
    const file = document.getElementById('decfileElem').files[0];

    if (!file || passphrase.length < 8) return;

    const fileData = await file.arrayBuffer();
    const iv = new Uint8Array(fileData.slice(0, 16));
    const encryptedContent = fileData.slice(16);
    const keyMaterial = await getKeyMaterial(passphrase);
    const key = await getKey(keyMaterial, 'decrypt');
    const decryptedContent = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv: iv },
        key,
        encryptedContent
    );

    const blob = new Blob([new Uint8Array(decryptedContent)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.getElementById('aDecsavefile');
    a.href = url;
    a.download = file.name.replace('.enc', '');
    a.classList.remove('d-none');
    document.getElementById('spnDecstatus').innerText = 'File decrypted successfully';
}

async function getKeyMaterial(password) {
    const enc = new TextEncoder();
    return crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );
}

async function getKey(keyMaterial, usage) {
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: new TextEncoder().encode('a unique salt'),
            iterations: 10000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-CBC', length: 256 },
        false,
        [usage]
    );
}

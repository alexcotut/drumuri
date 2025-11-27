export class BusyModal {
    constructor() {
        this.dialog = document.createElement('dialog');
        this.dialog.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; padding: 30px;">
                <div class="busy-modal-spinner" style="
                    width: 48px;
                    height: 48px;
                    border: 6px solid #ccc;
                    border-top: 6px solid #2196f3;
                    border-radius: 50%;
                    animation: busy-modal-spin 1s linear infinite;
                "></div>
                <div style="margin-top: 16px; font-size: 1.1em;">Loading...</div>
            </div>
            <style>
            @keyframes busy-modal-spin {
                0% { transform: rotate(0deg);}
                100% { transform: rotate(360deg);}
            }
            </style>
        `;
        document.body.appendChild(this.dialog);
        this.dialog.showModal();
    }

    dismiss() {
        this.dialog.close();
        document.body.removeChild(this.dialog);
    }
}
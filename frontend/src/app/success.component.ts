import { Component } from '@angular/core';

@Component({
  selector: 'app-success',
  standalone: true,
  template: `
    <div class="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div class="text-center p-5 rounded shadow bg-white">
        <h1 class="display-6 fw-bold text-success">Successfully submitted!</h1>
        <p class="text-muted">Thank you — your submission has been received.</p>
      </div>
    </div>
  `,
  styles: [
    `h1 { letter-spacing: 0.5px; }`,
    `.vh-100 { height: 100vh; }`
  ]
})
export class SuccessComponent {}

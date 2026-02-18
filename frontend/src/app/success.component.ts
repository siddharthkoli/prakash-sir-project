import { Component } from '@angular/core';

@Component({
  selector: 'app-success',
  standalone: true,
  template: `
    <div>
      <!-- <div style="background-color: #152549; padding: 20px 0;">
        <div class="container-fluid px-3 px-md-5">
          <div class="row align-items-center">
            <div class="col-lg-8 offset-lg-2">
              <div style="display: flex; align-items: center; gap: 20px;">
                <div style="flex-shrink: 0;">
                  <a href="https://nymasons.org/">
                    <img src="/assets/NYM-wordmark-light@3x.png" class="img-fluid" style="max-width: 250px; height: auto;">
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> -->

      <div class="min-vh-100" style="background-color: rgba(248,249,250,0.85);">
        <div class="container py-5">
          <div class="row">
            <div class="col-lg-8 offset-lg-2">
              <div class="bg-light p-4 rounded" style="background: rgba(255,255,255,0.85);">
                <div class="d-flex align-items-center justify-content-center" style="min-height:260px;">
                  <div class="text-center p-5 rounded shadow bg-white w-100">
                    <h1 class="display-6 fw-bold text-success">Successfully submitted!</h1>
                    <p class="text-muted">Thank you — your submission has been received.</p>

                    <div class="mt-4 text-start">
                      <h5 class="fw-semibold">What happens next</h5>
                      <ul class="list-unstyled mt-3">
                        <li class="d-flex align-items-start mb-3">
                          <span class="badge bg-success rounded-circle me-3" style="width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;">✓</span>
                          <div>
                            <strong>Reviewed by our membership team:</strong>
                            <div class="text-muted small">Your inquiry is reviewed by our membership team.</div>
                          </div>
                        </li>
                        <li class="d-flex align-items-start mb-3">
                          <span class="badge bg-success rounded-circle me-3" style="width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;">✓</span>
                          <div>
                            <strong>Forwarded locally:</strong>
                            <div class="text-muted small">It is forwarded to a local lodge near you for follow-up.</div>
                          </div>
                        </li>
                        <li class="d-flex align-items-start mb-3">
                          <span class="badge bg-success rounded-circle me-3" style="width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;">✓</span>
                          <div>
                            <strong>A member will contact you:</strong>
                            <div class="text-muted small">A member from the local lodge will reach out directly.</div>
                          </div>
                        </li>
                        <li class="d-flex align-items-start mb-0">
                          <span class="badge bg-success rounded-circle me-3" style="width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;">✓</span>
                          <div>
                            <strong>Meet and learn:</strong>
                            <div class="text-muted small">You’ll have the opportunity to meet, ask questions, and learn more. There is no obligation — only an open invitation to explore.</div>
                          </div>
                        </li>
                      </ul>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `h1 { letter-spacing: 0.5px; }`,
    `.vh-100 { height: 100vh; }`
  ]
})
export class SuccessComponent {}

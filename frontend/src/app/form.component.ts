import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SubmissionService } from './submission.service';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { TimeoutError } from 'rxjs';

@Component({
    selector: 'app-form',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, NgbModule, HttpClientModule],
    templateUrl: './app.html',
    styleUrls: ['./app.css']
})
export class FormComponent {
    form: FormGroup;
    submitting = false;
    errorMessage: string | null = null;

    constructor(private fb: FormBuilder, private submissionService: SubmissionService, private router: Router, private cdr: ChangeDetectorRef) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        this.form = this.fb.group({
            firstName: ['', [Validators.required, Validators.pattern(/^[A-Za-z]+$/)]],
            lastName: ['', [Validators.required, Validators.pattern(/^[A-Za-z]+$/)]],
            email: ['', [Validators.required, Validators.pattern(emailRegex)]],
            phone: ['', [Validators.required, Validators.pattern(/^[0-9()+\-\s]{10}$/)]],
            streetAddress1: ['', [Validators.required, Validators.minLength(3)]],
            streetAddress2: [''],
            city: ['', [Validators.required, Validators.pattern(/^[A-Za-z\s.'-]{2,}$/)]],
            state: ['', [Validators.required, Validators.pattern(/^[A-Za-z\s.'-]{2,}$/)]],
            zip: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
            whereToMeet: [''],
            comments: ['']
        });
    }

    submit() {
        this.form.markAllAsTouched();
        if (this.form.valid) {
            this.errorMessage = null;
            this.submitting = true;

            const body = {
                firstName: this.form.get('firstName')?.value,
                lastName: this.form.get('lastName')?.value,
                email: this.form.get('email')?.value,
                phone: this.form.get('phone')?.value,
                address: {
                    streetAddress1: this.form.get('streetAddress1')?.value,
                    streetAddress2: this.form.get('streetAddress2')?.value,
                    city: this.form.get('city')?.value,
                    state: this.form.get('state')?.value,
                    zip: this.form.get('zip')?.value
                },
                whereToMeet: this.form.get('whereToMeet')?.value,
                comments: this.form.get('comments')?.value || ''
            }

            console.log(this.form);
            console.log(body);

            this.submissionService.submit(body).pipe(
                finalize(() => {
                    this.submitting = false;
                    try { this.cdr.detectChanges(); } catch (_) { /* noop */ }
                })
            ).subscribe({
                next: (resp) => {
                    this.form.reset();
                    this.router.navigate(['/success']);
                },
                error: (err: any) => {
                    if (err instanceof TimeoutError) {
                        this.errorMessage = 'Request timed out. Please check your network and try again.';
                    } else if (err && err.status === 0) {
                        // status 0 usually means network error / CORS / server down
                        this.errorMessage = 'Unable to reach server. Please try again later.';
                    } else {
                        this.errorMessage = 'Something went wrong. Please try again.';
                    }
                    // force update so the alert appears immediately
                    try { this.cdr.detectChanges(); } catch (_) { /* noop */ }
                }
            });
        }
    }
}

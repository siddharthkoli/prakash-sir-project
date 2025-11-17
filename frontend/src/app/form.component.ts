import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SubmissionService } from './submission.service';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { TimeoutError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

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

    constructor(private fb: FormBuilder, private submissionService: SubmissionService, private router: Router, private cdr: ChangeDetectorRef, private http: HttpClient) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        this.form = this.fb.group({
            firstName: ['', [Validators.required, Validators.pattern(/^[A-Za-z]+$/)]],
            lastName: ['', [Validators.required, Validators.pattern(/^[A-Za-z]+$/)]],
            email: ['', [Validators.required, Validators.pattern(emailRegex)]],
            phone: ['', [Validators.required, Validators.pattern(/^[0-9()+\-\s]{10}$/)]],
            city: ['', [Validators.required]],
            state: ['', [Validators.required]],
            zip: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]],
            whereToMeet: [''],
            comments: ['']
        });

        // disable city and state so they can only be populated from the zip lookup
        this.form.get('city')?.disable();
        this.form.get('state')?.disable();

        // Listen for zip code changes and auto-populate city/state
        this.form.get('zip')?.valueChanges.subscribe(zip => {
            if (zip && /^[0-9]{5}$/.test(zip)) {
                this.fetchCityAndState(zip);
            }
        });
    }

    fetchCityAndState(zip: string) {
        // Using ZipCodeAPI or similar service - adjust the URL based on your backend API
        // For this example, we'll use a free zip code API
        this.http.get<any>(`https://api.zippopotam.us/us/${zip}`).subscribe({
            next: (response) => {
                if (response && response.places && response.places.length > 0) {
                    const place = response.places[0];
                    this.form.patchValue({
                        city: place['place name'],
                        state: place['state']
                    });
                }
            },
            error: (err) => {
                console.log('Could not fetch city/state for zip code');
            }
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

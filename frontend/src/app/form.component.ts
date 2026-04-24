import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SubmissionService } from './submission.service';
import { Router, ActivatedRoute } from '@angular/router';
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
    utmSource: string | null = null;
    utmMedium: string | null = null;
    utmCampaign: string | null = null;
    utmContent: string | null = null;
    utmTerm: string | null = null;
    gclid: string | null = null;
    fbclid: string | null = null;
    landingPageUrl: string | null = null;
    referrerUrl: string | null = null;

    professions: any[] = [
    {
      "category": "Business & Finance",
      "options": [
        "Accountant / CPA",
        "Banker",
        "Business Owner",
        "CEO / Executive",
        "Financial Advisor",
        "Insurance Professional",
        "Real Estate Professional",
        "Sales Professional"
      ]
    },
    {
      "category": "Legal & Government",
      "options": [
        "Attorney / Lawyer",
        "Government Employee",
        "Law Enforcement Officer",
        "Military (Active Duty)",
        "Military (Veteran)"
      ]
    },
    {
      "category": "Healthcare",
      "options": [
        "Dentist",
        "Nurse",
        "Pharmacist",
        "Physician / Doctor",
        "Veterinarian",
        "Healthcare Administrator"
      ]
    },
    {
      "category": "Education",
      "options": [
        "Professor / Academic",
        "Teacher / Educator",
        "Student"
      ]
    },
    {
      "category": "Technology & Engineering",
      "options": [
        "Data Analyst",
        "Engineer",
        "IT Professional",
        "Project Manager",
        "Researcher",
        "Scientist",
        "Technician"
      ]
    },
    {
      "category": "Skilled Trades",
      "options": [
        "Contractor",
        "Electrician",
        "Plumber",
        "HVAC Technician",
        "Tradesperson (Other)",
        "Truck Driver / Transportation"
      ]
    },
    {
      "category": "Creative & Media",
      "options": [
        "Actor / Performer",
        "Artist / Designer",
        "Chef",
        "Journalist / Writer",
        "Marketing Professional"
      ]
    },
    {
      "category": "Other",
      "options": [
        "Clergy / Religious Leader",
        "Consultant",
        "Homemaker",
        "Retired",
        "Self-Employed",
        "Unemployed",
        "Other"
      ]
    }
  ]

    constructor(private fb: FormBuilder, private submissionService: SubmissionService, private router: Router, private cdr: ChangeDetectorRef, private http: HttpClient, private route: ActivatedRoute) {
        // Extract utm_source from query parameters
        this.route.queryParams.subscribe(params => {
            this.utmSource = params['utm_source'] || null;
            this.utmMedium = params['utm_medium'] || null;
            this.utmCampaign = params['utm_campaign'] || null;
            this.utmContent = params['utm_content'] || null;
            this.utmTerm = params['utm_term'] || null;
            this.gclid = params['gclid'] || null;
            this.fbclid = params['fbclid'] || null;
            this.landingPageUrl = window.location.href;
            this.referrerUrl = document.referrer || null;
        });
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        this.form = this.fb.group({
            firstName: ['', [Validators.required, Validators.pattern(/^[A-Za-z]+$/)]],
            lastName: ['', [Validators.required, Validators.pattern(/^[A-Za-z]+$/)]],
            email: ['', [Validators.required, Validators.pattern(emailRegex)]],
            phone: ['', [Validators.required, Validators.pattern(/^[0-9()+\-\s]{10}$/)]],
            alternatePhone: ['', [Validators.pattern(/^[0-9()+\-\s]{10}$/)]],
            bestTimeToContact: ['anyday'],
            city: ['', [Validators.required]],
            state: ['', [Validators.required]],
            county: ['', [Validators.required]],
            zip: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]],
            lodgeCity: [''],
            lodgeState: [''],
            lodgeCounty: [''],
            lodgeZip: ['', [Validators.pattern(/^[0-9]{5}$/)]],
            // firstResponder: ['', [Validators.required]],
            faith: ['', [Validators.required]],
            whereToMeet: [''],
            preferredContactMethod: ['Phone', Validators.required],
            age: ['', [Validators.required]],
            // veteran: ['', [Validators.required]],
            // lawEnforcement: ['', [Validators.required]],
            employmentStatus: ['Full Time', Validators.required],
            employmentTypeCategory: [''],
            employmentType: [''],
            comments: ['', Validators.required],
        });

        // disable city and state so they can only be populated from the zip lookup
        this.form.get('city')?.disable();
        this.form.get('state')?.disable();
        this.form.get('county')?.disable();
        
        this.form.get('lodgeCity')?.disable();
        this.form.get('lodgeState')?.disable();
        this.form.get('lodgeCounty')?.disable();

        // Listen for zip code changes and auto-populate city/state
        this.form.get('zip')?.valueChanges.subscribe(zip => {
            if (zip && /^[0-9]{5}$/.test(zip)) {
                this.fetchCityAndState(zip, false);
                this.fetchCounty(zip, false);
            } else if (!zip) {
                // Clear city, state, county when zip is cleared
                this.form.patchValue({
                    city: '',
                    state: '',
                    county: ''
                });
            }
        });
        this.form.get('lodgeZip')?.valueChanges.subscribe(zip => {
            if (zip && /^[0-9]{5}$/.test(zip)) {
                this.fetchCityAndState(zip, true);
                this.fetchCounty(zip, true);
            } else if (!zip) {
                // Clear lodge city, state, county when lodgeZip is cleared
                this.form.patchValue({
                    lodgeCity: '',
                    lodgeState: '',
                    lodgeCounty: ''
                });
            }
        });
    }

    fetchCityAndState(zip: string, isLodge: boolean) {
        this.http.get<any>(`https://api.zippopotam.us/us/${zip}`).subscribe({
            next: (response) => {
                if (response && response.places && response.places.length > 0) {
                    const place = response.places[0];
                    isLodge ? this.form.patchValue({
                        lodgeCity: place['place name'],
                        lodgeState: place['state']
                    }) : this.form.patchValue({
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

    fetchCounty(zip: string, isLodge: boolean) {
        const url = "https://api.api-ninjas.com/v1/county?zipcode=" + zip;
        const headers = {
            'X-Api-Key': 'aYh25gRvcQhKCUXEazat9Z5KhSkMDhOBheKd3TjV'
        }
        this.http.get<any>(url, { headers }).subscribe({
            next: (response) => {
                if (response && response.length > 0 && response[0].county_name) {
                    isLodge ? this.form.patchValue({
                        lodgeCounty: response[0].county_name.replace(' County', '') // remove "County" suffix if present
                    }) : this.form.patchValue({ 
                        county: response[0].county_name.replace(' County', '') // remove "County" suffix if present
                    })
                }
            },
            error: (err) => {
                console.log('Could not fetch county for zip code');
            }
        });
    }

    getSelectedCategoryOptions(): string[] {
        const selectedCategory = this.form.get('employmentTypeCategory')?.value;
        if (selectedCategory) {
            const profession = this.professions.find(p => p.category === selectedCategory);
            return profession ? profession.options : [];
        }
        return [];
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
                alternatePhone: this.form.get('alternatePhone')?.value || '',
                bestTimeToContact: this.form.get('bestTimeToContact')?.value,
                address: {
                    city: this.form.get('city')?.value,
                    state: this.form.get('state')?.value,
                    zip: this.form.get('zip')?.value,
                    county: this.form.get('county')?.value,
                },
                preferredLodgeAddress: {
                    city: this.form.get('lodgeCity')?.value,
                    state: this.form.get('lodgeState')?.value,
                    zip: this.form.get('lodgeZip')?.value,
                    county: this.form.get('lodgeCounty')?.value,
                },
                preferredContactMethod: this.form.get('preferredContactMethod')?.value,
                employmentStatus: this.form.get('employmentStatus')?.value,
                employmentTypeCategory: this.form.get('employmentTypeCategory')?.value || '',
                employmentType: this.form.get('employmentType')?.value || '',
                comments: this.form.get('comments')?.value || '',
                age: this.form.get('age')?.value,
                faith: this.form.get('faith')?.value,
                utmSource: this.utmSource,
                utm_medium: this.utmMedium,
                utm_campaign: this.utmCampaign,
                utm_content: this.utmContent,
                utm_term: this.utmTerm,
                gclid: this.gclid,
                fbclid: this.fbclid,
                landing_page_url: this.landingPageUrl,
                referrer_url: this.referrerUrl
            }

            this.submissionService.submit(body).pipe(
                finalize(() => {
                    this.submitting = false;
                    try { this.cdr.detectChanges(); } catch (_) { /* noop */ }
                })
            ).subscribe({
                next: (resp) => {
                    this.form.reset();
                    // restore defaults after reset
                    try { this.form.get('preferredContactMethod')?.setValue('either'); } catch (_) { /* noop */ }
                    window.top.location.href = 'https://newyorkmasons.org/inquiry-confirmation/';
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

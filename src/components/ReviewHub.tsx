import { useState, useEffect } from 'react';
import { ChevronRight, Star, Upload, X, Check, AlertCircle } from 'lucide-react';

const THEME = {
  brandColor: '#90B5C9',
  backgroundColor: '#E9E6DF',
  textColor: '#0E0E0E',
  font: 'Inter',
  logoUrl: 'https://synergaise.com/assets/logo.svg'
};

type PageType = 'landing' | 'short_review' | 'testimonial_deepdive' | 'success';

interface FormData {
  [key: string]: string;
  formType?: string;
}

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  data: string;
}

// Extracted components to prevent re-creation on each render
const StarRating = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => (
  <div className="flex gap-2">
    {[1, 2, 3, 4, 5].map(star => (
      <Star
        key={star}
        className={`w-8 h-8 cursor-pointer transition-all duration-200 ${
          star <= value ? 'fill-secondary text-secondary' : 'text-muted-foreground'
        }`}
        onClick={() => onChange(star)}
      />
    ))}
  </div>
);

const TextInput = ({ 
  id, 
  label, 
  type = 'text', 
  required, 
  placeholder, 
  maxLength,
  value,
  onChange,
  error
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  value: string;
  onChange: (id: string, value: string) => void;
  error?: string | null;
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-foreground">
      {label} {!required && <span className="text-muted-foreground">(optional)</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(id, e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
    />
    {maxLength && (
      <div className="text-xs text-muted-foreground text-right font-metrics">
        {value.length} / {maxLength}
      </div>
    )}
    {error && <p className="text-destructive text-sm">{error}</p>}
  </div>
);

const TextArea = ({ 
  id, 
  label, 
  required, 
  placeholder, 
  maxLength = 1000,
  value,
  onChange,
  error
}: {
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  value: string;
  onChange: (id: string, value: string) => void;
  error?: string | null;
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-foreground">
      {label} {!required && <span className="text-muted-foreground">(optional)</span>}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(id, e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={4}
      className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all duration-200"
    />
    <div className="text-xs text-muted-foreground text-right font-metrics">
      {value.length} / {maxLength}
    </div>
    {error && <p className="text-destructive text-sm">{error}</p>}
  </div>
);

const SingleChoice = ({ 
  id, 
  label, 
  choices, 
  required,
  value,
  onChange,
  error
}: {
  id: string;
  label: string;
  choices: string[];
  required?: boolean;
  value: string;
  onChange: (id: string, value: string) => void;
  error?: string | null;
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-foreground">{label}</label>
    <div className="space-y-2">
      {choices.map(choice => (
        <label key={choice} className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-primary/10 transition-all duration-200">
          <input
            type="radio"
            name={id}
            value={choice}
            checked={value === choice}
            onChange={(e) => onChange(id, e.target.value)}
            className="w-5 h-5 text-primary accent-primary"
          />
          <span className="group-hover:text-primary transition-colors duration-200">{choice}</span>
        </label>
      ))}
    </div>
    {error && <p className="text-destructive text-sm">{error}</p>}
  </div>
);

const ReviewHub = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('landing');
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [rating, setRating] = useState(0);

  // Auto-save draft for testimonial deep-dive
  useEffect(() => {
    if (currentPage === 'testimonial_deepdive' && Object.keys(formData).length > 0) {
      const timer = setTimeout(() => {
        localStorage.setItem('testimonial_draft', JSON.stringify({
          data: formData,
          timestamp: new Date().toISOString()
        }));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [formData, currentPage]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('testimonial_draft');
    if (draft) {
      const { data, timestamp } = JSON.parse(draft);
      const age = Date.now() - new Date(timestamp).getTime();
      if (age < 24 * 60 * 60 * 1000) {
        setFormData(data);
      }
    }
  }, []);

  const validateField = (id: string, value: string, required: boolean) => {
    if (required && !value) return 'This field is required';
    if (id === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email';
    }
    return null;
  };

  const handleInputChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    const error = validateField(id, value, true);
    setErrors(prev => ({ ...prev, [id]: error }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, logo: 'Please upload JPG, PNG, or SVG only' }));
      return;
    }

    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, logo: 'File must be under 5MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedFile({
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result as string
      });
      setErrors(prev => ({ ...prev, logo: null }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (formType: string) => {
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      reviewType: formType,
      submittedAt: new Date().toISOString(),
      ...formData,
      rating: rating || null,
      file: uploadedFile,
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };

    try {
      const response = await fetch('https://synergaise.app.n8n.cloud/webhook/review-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Submission failed');

      localStorage.removeItem('testimonial_draft');
      setCurrentPage('success');
      setFormData(prev => ({ ...prev, formType }));
    } catch (error) {
      setSubmitError('Unable to submit. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentPage === 'landing') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-2xl w-full space-y-8 text-center animate-in fade-in duration-700">
          <div className="flex justify-center items-center mb-8">
            <img src="/synergaise-logo.png" alt="Synergaise" className="h-32 w-32 object-contain animate-in fade-in zoom-in duration-700" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-heading font-bold text-foreground">Share Your Experience with SYNERG<span className="text-primary">AI</span>SE</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              We'd love your feedback — it helps us grow and show what kind of impact we're creating for clients. Choose the option that best fits your time today.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <button
              onClick={() => setCurrentPage('short_review')}
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold shadow-[0_4px_10px_rgba(0,0,0,0.05)] transition-all duration-200 hover:bg-primary-hover hover:scale-[0.98] active:scale-95"
            >
              Short Review (2-3 mins) 
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => setCurrentPage('testimonial_deepdive')}
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-secondary text-secondary-foreground rounded-xl font-semibold shadow-[0_4px_10px_rgba(0,0,0,0.05)] transition-all duration-200 hover:bg-secondary/80 hover:scale-[0.98] active:scale-95"
            >
              Testimonial Deep-Dive (5–7 mins) 
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground pt-4">
            All responses are confidential until you grant permission for public use.
          </p>
        </div>
      </div>
    );
  }

  if (currentPage === 'short_review') {
    return (
      <div className="min-h-screen p-6 bg-background">
        <div className="max-w-3xl mx-auto space-y-8">
          <button 
            onClick={() => setCurrentPage('landing')} 
            className="text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            ← Back
          </button>
          
          <div className="space-y-4">
            <h1 className="text-3xl font-heading font-bold text-foreground">Short Review</h1>
            <p className="text-muted-foreground">
              Perfect for featuring on our website, proposals, and case studies. Just a few quick questions about your experience.
            </p>
          </div>

          <div className="space-y-6 bg-gradient-to-br from-card-gradient-start to-card-gradient-end p-8 rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
            <TextInput 
              id="name" 
              label="Full Name" 
              required 
              maxLength={100} 
              value={formData['name'] || ''} 
              onChange={handleInputChange}
              error={errors['name']}
            />
            <TextInput 
              id="company" 
              label="Company Name" 
              required 
              maxLength={100} 
              value={formData['company'] || ''} 
              onChange={handleInputChange}
              error={errors['company']}
            />
            <TextInput 
              id="email" 
              label="Email" 
              type="email" 
              maxLength={100} 
              value={formData['email'] || ''} 
              onChange={handleInputChange}
              error={errors['email']}
            />
            
            <TextArea 
              id="q1_experience" 
              label="1. How would you describe your overall experience working with me/us?" 
              required 
              placeholder="Share your thoughts on the overall experience..."
              value={formData['q1_experience'] || ''} 
              onChange={handleInputChange}
              error={errors['q1_experience']}
            />
            
            <TextArea 
              id="q2_problem" 
              label="2. What specific problem or process did we help you solve?" 
              required 
              placeholder="Describe the challenge we addressed..."
              value={formData['q2_problem'] || ''} 
              onChange={handleInputChange}
              error={errors['q2_problem']}
            />
            
            <TextArea 
              id="q3_change" 
              label="3. What's changed in your business or workflow since implementing the automation/solution?" 
              required 
              placeholder="Tell us about the improvements you've noticed..."
              value={formData['q3_change'] || ''} 
              onChange={handleInputChange}
              error={errors['q3_change']}
            />
            
            <TextArea 
              id="q4_standout" 
              label="4. What stood out to you most about the process or communication?" 
              required 
              placeholder="What impressed you most..."
              value={formData['q4_standout'] || ''} 
              onChange={handleInputChange}
              error={errors['q4_standout']}
            />
            
            <TextArea 
              id="q5_recommend" 
              label="5. Would you recommend our services to others — and if so, why?" 
              required 
              placeholder="Your recommendation..."
              value={formData['q5_recommend'] || ''} 
              onChange={handleInputChange}
              error={errors['q5_recommend']}
            />
            
            <TextArea 
              id="q6_additional" 
              label="6. Anything else you'd like to add about the results or impact so far?" 
              placeholder="Any additional thoughts or results..."
              value={formData['q6_additional'] || ''} 
              onChange={handleInputChange}
              error={errors['q6_additional']}
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">How would you rate your experience?</label>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <SingleChoice 
              id="permission" 
              label="Can we feature your review publicly on our website or proposals?" 
              choices={['Yes', 'No']} 
              required
              value={formData['permission'] || ''} 
              onChange={handleInputChange}
              error={errors['permission']}
            />

            {submitError && (
              <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive rounded-xl">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <p className="text-destructive">{submitError}</p>
              </div>
            )}

            <button
              onClick={() => handleSubmit('Short Review')}
              disabled={isSubmitting}
              className="w-full py-4 bg-primary text-primary-foreground hover:bg-primary-hover disabled:bg-muted disabled:cursor-not-allowed rounded-xl font-semibold shadow-[0_4px_10px_rgba(0,0,0,0.05)] transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[0.98] active:scale-95"
            >
              {isSubmitting ? 'Submitting...' : 'SEND REVIEW'}
              {!isSubmitting && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By submitting, you agree to our privacy policy. We'll only use your data as specified.
          </p>
        </div>
      </div>
    );
  }

  if (currentPage === 'testimonial_deepdive') {
    return (
      <div className="min-h-screen p-6 bg-background">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => setCurrentPage('landing')} 
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              ← Back
            </button>
            {draftSaved && (
              <div className="flex items-center gap-2 text-secondary text-sm">
                <Check className="w-4 h-4" /> Draft saved
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-heading font-bold text-foreground">Testimonial Deep-Dive</h1>
            <p className="text-muted-foreground">
              For detailed story-style testimonials, Looms, or comprehensive case studies. Your story helps potential clients understand the real impact.
            </p>
          </div>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-card-gradient-start to-card-gradient-end p-8 rounded-xl space-y-6 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
              <h2 className="text-xl font-heading font-semibold border-b border-border pb-3">Your Information</h2>
              <TextInput 
                id="name" 
                label="Full Name" 
                required 
                maxLength={100}
                value={formData['name'] || ''}
                onChange={handleInputChange}
                error={errors['name']}
              />
              <TextInput 
                id="company" 
                label="Company / Brand" 
                required 
                maxLength={100}
                value={formData['company'] || ''}
                onChange={handleInputChange}
                error={errors['company']}
              />
              <TextInput 
                id="role" 
                label="Role / Title" 
                maxLength={100}
                value={formData['role'] || ''}
                onChange={handleInputChange}
                error={errors['role']}
              />
              <TextInput 
                id="email" 
                label="Email" 
                type="email" 
                maxLength={100}
                value={formData['email'] || ''}
                onChange={handleInputChange}
                error={errors['email']}
              />
            </div>

            <div className="bg-gradient-to-br from-card-gradient-start to-card-gradient-end p-8 rounded-xl space-y-6 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
              <h2 className="text-xl font-heading font-semibold border-b border-border pb-3">Your Story</h2>
              
              <TextArea 
                id="q1_challenges" 
                label="1. What challenges were you facing before working with us?" 
                required 
                placeholder="Describe the situation before we started working together..."
                value={formData['q1_challenges'] || ''}
                onChange={handleInputChange}
                error={errors['q1_challenges']}
              />
              
              <TextArea 
                id="q2_decision" 
                label="2. How did you hear about us and what made you decide to move forward?" 
                required 
                placeholder="What influenced your decision to work with us..."
                value={formData['q2_decision'] || ''}
                onChange={handleInputChange}
                error={errors['q2_decision']}
              />
              
              <TextArea 
                id="q3_first_impression" 
                label="3. What was your first impression of the setup, onboarding, or workflow design?" 
                required 
                placeholder="Your initial thoughts on the process..."
                value={formData['q3_first_impression'] || ''}
                onChange={handleInputChange}
                error={errors['q3_first_impression']}
              />
            </div>

            <div className="bg-gradient-to-br from-card-gradient-start to-card-gradient-end p-8 rounded-xl space-y-6 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
              <h2 className="text-xl font-heading font-semibold border-b border-border pb-3">The Impact</h2>
              
              <TextArea 
                id="q4_impact" 
                label="4. How has the automation or AI solution impacted your team's time, accuracy, or client experience?" 
                required 
                placeholder="Describe the tangible improvements..."
                value={formData['q4_impact'] || ''}
                onChange={handleInputChange}
                error={errors['q4_impact']}
              />
              
              <TextArea 
                id="q5_quantify" 
                label="5. Can you quantify any results — time saved, leads generated, revenue improved, or tasks automated?" 
                placeholder="Share any numbers or metrics you can..."
                value={formData['q5_quantify'] || ''}
                onChange={handleInputChange}
                error={errors['q5_quantify']}
              />
              
              <TextArea 
                id="q6_aha_moment" 
                label="6. What was the biggest 'aha' or most valuable part of the project for you?" 
                required 
                placeholder="What was the game-changing moment..."
                value={formData['q6_aha_moment'] || ''}
                onChange={handleInputChange}
                error={errors['q6_aha_moment']}
              />
              
              <TextArea 
                id="q7_describe_working" 
                label="7. How would you describe working with us to someone considering doing the same?" 
                required 
                placeholder="What would you tell someone thinking about working with us..."
                value={formData['q7_describe_working'] || ''}
                onChange={handleInputChange}
                error={errors['q7_describe_working']}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Overall experience rating</label>
                <StarRating value={rating} onChange={setRating} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-card-gradient-start to-card-gradient-end p-8 rounded-xl space-y-6 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
              <h2 className="text-xl font-heading font-semibold border-b border-border pb-3">Permissions & Media</h2>
              
              <SingleChoice 
                id="q8_feature_permission" 
                label="8. Would you be open to having your testimonial featured on our website or case study library?" 
                choices={['Yes, absolutely', 'Yes, but please check with me first', 'No, keep it private']} 
                required
                value={formData['q8_feature_permission'] || ''}
                onChange={handleInputChange}
                error={errors['q8_feature_permission']}
              />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Upload a photo or company logo <span className="text-muted-foreground">(optional)</span>
                </label>
                <p className="text-xs text-muted-foreground">JPG, PNG, or SVG up to 5MB</p>
                {!uploadedFile ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload</span>
                    <input type="file" accept="image/jpeg,image/png,image/svg+xml" onChange={handleFileUpload} className="hidden" />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-secondary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{uploadedFile.name}</p>
                        <p className="text-xs text-muted-foreground font-metrics">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setUploadedFile(null)} 
                      className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
                {errors.logo && <p className="text-destructive text-sm">{errors.logo}</p>}
              </div>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive rounded-xl">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <p className="text-destructive">{submitError}</p>
              </div>
            )}

            <button
              onClick={() => handleSubmit('Testimonial Deep-Dive')}
              disabled={isSubmitting}
              className="w-full py-4 bg-primary text-primary-foreground hover:bg-primary-hover disabled:bg-muted disabled:cursor-not-allowed rounded-xl font-semibold shadow-[0_4px_10px_rgba(0,0,0,0.05)] transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[0.98] active:scale-95"
            >
              {isSubmitting ? 'Submitting...' : 'SEND REVIEW'}
              {!isSubmitting && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By submitting, you agree to our privacy policy. We'll only use your data as specified.
          </p>
        </div>
      </div>
    );
  }

  if (currentPage === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-2xl w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
            <Check className="w-10 h-10 text-secondary-foreground" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-foreground">Thank You! 🙏</h1>
          <p className="text-lg text-muted-foreground">
            {formData.formType === 'Short Review' 
              ? "We appreciate your time — your feedback helps us improve and inspire others. We'll let you know once it goes live!"
              : "Your testimonial means a lot — we'll be in touch when it's published on the Synergaise site or used in our case studies."}
          </p>
          <button
            onClick={() => {
              setCurrentPage('landing');
              setFormData({});
              setRating(0);
              setUploadedFile(null);
            }}
            className="px-8 py-3 bg-primary text-primary-foreground hover:bg-primary-hover rounded-xl font-semibold shadow-[0_4px_10px_rgba(0,0,0,0.05)] transition-all duration-200 hover:scale-[0.98] active:scale-95"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ReviewHub;
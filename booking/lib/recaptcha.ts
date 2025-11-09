/**
 * reCAPTCHA v3 Integration
 * 
 * Get your keys at: https://www.google.com/recaptcha/admin
 */

/**
 * Load reCAPTCHA script (client-side)
 */
export function loadRecaptchaScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('reCAPTCHA can only be loaded in browser'));
      return;
    }

    // Check if already loaded
    if ((window as any).grecaptcha) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
    
    document.head.appendChild(script);
  });
}

/**
 * Execute reCAPTCHA and get token (client-side)
 */
export async function executeRecaptcha(action: string): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('reCAPTCHA can only be executed in browser');
  }

  // Ensure script is loaded
  await loadRecaptchaScript();
  
  return new Promise((resolve, reject) => {
    (window as any).grecaptcha.ready(() => {
      (window as any).grecaptcha
        .execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, { action })
        .then((token: string) => resolve(token))
        .catch((error: any) => reject(error));
    });
  });
}

/**
 * Verify reCAPTCHA token (server-side)
 */
export async function verifyRecaptchaToken(
  token: string,
  expectedAction?: string
): Promise<{ success: boolean; score: number; action: string; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('⚠️ RECAPTCHA_SECRET_KEY not configured');
    // In development, allow bypass
    if (process.env.NODE_ENV === 'development') {
      return { success: true, score: 0.9, action: expectedAction || 'development' };
    }
    return { success: false, score: 0, action: '', error: 'reCAPTCHA not configured' };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        score: 0,
        action: data.action || '',
        error: data['error-codes']?.join(', ') || 'Verification failed',
      };
    }

    // Check if action matches (if provided)
    if (expectedAction && data.action !== expectedAction) {
      return {
        success: false,
        score: data.score || 0,
        action: data.action || '',
        error: 'Action mismatch',
      };
    }

    // Score threshold: 0.5 or higher is considered human
    // You can adjust this based on your needs
    const isHuman = data.score >= 0.5;

    return {
      success: isHuman,
      score: data.score || 0,
      action: data.action || '',
      error: isHuman ? undefined : 'Low score - possible bot',
    };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return {
      success: false,
      score: 0,
      action: '',
      error: 'Verification failed',
    };
  }
}

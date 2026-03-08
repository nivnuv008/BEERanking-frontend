let googleScriptPromise;

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));    

    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export async function getGoogleIdToken(clientId) {
  if (!clientId) {
    throw new Error('Missing Google Client ID (VITE_GOOGLE_CLIENT_ID)');
  }

  await loadGoogleScript();

  return new Promise((resolve, reject) => {
    const googleApi = window.google?.accounts?.id;

    if (!googleApi) {
      reject(new Error('Google Identity Services is unavailable'));
      return;
    }

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    const cleanup = () => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };

    try {
      googleApi.initialize({
        client_id: clientId,
        callback: (response) => {
          cleanup();
          if (response?.credential) {
            resolve(response.credential);
          } else {
            reject(new Error('Google sign-in failed - no credential received'));
          }
        },
        cancel_on_tap_outside: false
      });

      googleApi.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        width: 250
      });

      setTimeout(() => {
        const button = container.querySelector('[role="button"]');
        if (button) {
          button.click();
        } else {
          cleanup();
          reject(new Error('Google sign-in button not found'));
        }
      }, 100);

      setTimeout(() => {
        cleanup();
        reject(new Error('Google sign-in timed out'));
      }, 60000);

    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

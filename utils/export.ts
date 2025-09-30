export function createFileInput(accept: string = '.json'): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      resolve(file || null);
    };
    
    input.oncancel = () => resolve(null);
    
    input.click();
  });
}

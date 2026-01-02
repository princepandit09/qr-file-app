import { Component, signal, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkDropList, CdkDragDrop } from '@angular/cdk/drag-drop';
import QRCode from 'qrcode';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DragDropModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('qr-file-app');
  
  selectedFile = signal<File | null>(null);
  fileUrl = signal<string>('');
  qrValue = signal<string>('');
  uploading = signal<boolean>(false);
  elementType = 'url';
  correctionLevel = 'H';
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile.set(file);
      this.readFile(file);
    }
  }
  
  onFileDropped(event: CdkDragDrop<string[]>): void {
    //event.preventDefault();
    const files = event.item.data as any[];
    if (files && files.length > 0) {
      const file = files[0];
      this.selectedFile.set(file);
      this.readFile(file);
    }
  }
  
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }
  
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      this.selectedFile.set(file);
      this.readFile(file);
    }
  }
  
  readFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        this.fileUrl.set(result);
        this.qrValue.set(result);
      }
    };
    reader.readAsDataURL(file);
  }

  // Add these properties
qrUrl = signal('');
apiUrl = 'https://localhost:7100/api/FileUpload'; // Your .NET API

// Add these methods
formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async uploadFile(): Promise<void> {
  if (!this.selectedFile()) return;
  
  this.uploading.set(true);
  
  const formData = new FormData();
  formData.append('file', this.selectedFile()!);
  
  try {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    this.qrUrl.set(result.url);
    this.qrValue.set(result.url);
    
    // Generate QR code
    await this.generateQR(result.url);
  } catch (error) {
    console.error('Upload failed:', error);
  } finally {
    this.uploading.set(false);
  }
}

// Update generateQR method:
async generateQR(url: string): Promise<void> {
  if (this.qrCanvas?.nativeElement) {
    const canvas = this.qrCanvas.nativeElement;
    try {
      await QRCode.toCanvas(canvas, url, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
    } catch (err) {
      console.error('QR generation failed:', err);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QR Error', 100, 100);
    }
  }
}

downloadQR(): void {
  if (this.qrCanvas?.nativeElement) {
    const canvas = this.qrCanvas.nativeElement;
    const link = document.createElement('a');
    link.download = 'qr-code.png';
    link.href = canvas.toDataURL();
    link.click();
  }
}
  
  // downloadQR(): void {
  //   const qrElement = document.querySelector('ngx-qrcode canvas') as HTMLCanvasElement;
  //   if (qrElement) {
  //     const image = qrElement.toDataURL('image/png');
  //     const link = document.createElement('a');
  //     link.href = image;
  //     link.download = 'qr-code.png';
  //     link.click();
  //   }
  // }
}


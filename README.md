# E-Sign MVP

A simple, fast, and secure PDF e-signing application built with React, Vite, and Supabase.

## Features

-   **PDF Upload**: Easily upload PDF documents.
-   **PDF Viewing**: View PDFs directly in the browser.
-   **Signature Creation**: Draw your signature using a signature pad.
-   **Drag & Drop**: Place your signature exactly where you want it on the document.
-   **Download**: Download the signed PDF with your signature embedded.
-   **Authentication**: Secure user authentication powered by Supabase.

## Technology Stack

-   **Frontend**: React, Vite
-   **Styling**: Tailwind CSS
-   **Icons**: Lucide React
-   **PDF Handling**: react-pdf, pdf-lib
-   **Drag & Drop**: react-draggable
-   **Signature Pad**: react-signature-canvas
-   **Backend/Auth**: Supabase

## Setup Instructions

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env` file in the root directory (copy from `.env.example` if available) and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the application**:
    ```bash
    npm run dev
    ```

## Usage

1.  **Sign In/Sign Up**: Create an account or log in.
2.  **Upload**: Click the upload area to select a PDF file.
3.  **Sign**: Click "Add Signature" to draw your signature.
4.  **Place**: Drag the signature to the desired location on the PDF.
5.  **Download**: Click "Download PDF" to save the signed document.

## License

MIT

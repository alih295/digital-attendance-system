import { Scanner } from "@yudiel/react-qr-scanner";

export default function QRScanner({ onScan }) {
  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-md">
        <Scanner
          // Force back camera for mobile
          constraints={{ 
            facingMode: 'environment' 
          }}
          onScan={(result) => {
            if (result?.[0]?.rawValue) {
              onScan(result[0].rawValue);
            }
          }}
          onError={(err) => {
            console.error("Scanner Error:", err);
            // Agar permission error hai toh alert dikhayein
            if (err.name === 'NotAllowedError') {
              alert("Please allow camera access in browser settings.");
            }
          }}
        />
      </div>
    </div>
  );
}
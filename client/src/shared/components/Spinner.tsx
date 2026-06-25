// client/src/shared/components/Spinner.tsx

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export const Spinner = ({ size = 'medium', message }: SpinnerProps) => {
  const sizeMap = {
    small: '24px',
    medium: '40px',
    large: '60px',
  };

  return (
    <div className="spinner-container">
      <div
        className="spinner"
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
        }}
      />
      {message && <p style={{ marginTop: '1rem', color: '#8b949e' }}>{message}</p>}
    </div>
  );
};
// client/src/shared/components/Spinner.tsx

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export const Spinner = ({ size = 'medium', message }: SpinnerProps) => {
  const sizeMap = {
    small: 'spinner-sm',
    medium: 'spinner',
    large: 'spinner-lg',
  };

  // Si queremos tamaños personalizados con estilo inline
  const sizeStyle = {
    small: { width: '24px', height: '24px' },
    medium: { width: '40px', height: '40px' },
    large: { width: '60px', height: '60px' },
  };

  return (
    <div className="spinner-container">
      <div
        className={sizeMap[size]}
        style={sizeStyle[size]}
      />
      {message && <p className="loading-text">{message}</p>}
    </div>
  );
};
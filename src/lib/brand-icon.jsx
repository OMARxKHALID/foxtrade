export const BrandIcon = ({ size }) => {
  const mark = Math.round(size * 0.56);
  return (
    <div tw="flex h-full w-full items-center justify-center bg-black">
      <svg width={mark} height={Math.round(mark * 0.86)} viewBox="0 0 28 24" fill="none">
        <path d="M8 3 3 21M15 3l-5 18M22 3l-5 18" stroke="#ff6a2a" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
};

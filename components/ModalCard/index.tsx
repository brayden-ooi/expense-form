import clsx from "clsx";


interface ModalCardProps {
  children: React.ReactNode;
  handleSelect: () => void;
  isSelected: boolean;
}
const ModalCard: React.FC<ModalCardProps> = ({
  children,
  handleSelect,
  isSelected,
}) => (
  <div
    className={clsx(
      "rounded-md border border-gray-300 bg-white py-2 text-base text-gray-700 shadow-sm",
      isSelected && "outline-none ring-2 ring-indigo-500 ring-offset-2"
    )}
    onClick={handleSelect}
  >
    {children}
  </div>
);

export default ModalCard;

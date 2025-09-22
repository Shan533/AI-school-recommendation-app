import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, ...props }) => {
  return (
    <label className="flex items-center space-x-2">
      <input type="checkbox" className="form-checkbox" {...props} />
      {label && <span>{label}</span>}
    </label>
  );
};

export default Checkbox;

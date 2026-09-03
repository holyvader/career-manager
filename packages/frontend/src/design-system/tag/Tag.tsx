import { Button } from '@ds/button/Button';
import { Input } from '@ds/input/Input';

export interface TagProps {
  name: string;
  value: string;
  inputName?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onDelete?: () => void;
  deleteLabel?: string;
}

export function Tag({
  name,
  value,
  inputName = 'tagIds',
  checked,
  onCheckedChange,
  onDelete,
  deleteLabel,
}: TagProps) {
  return (
    <span className="d-badge d-badge-outline gap-1 py-3">
      <label className="flex cursor-pointer items-center gap-1">
        <Input
          type="checkbox"
          name={inputName}
          value={value}
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          size="sm"
        />
        {name}
      </label>
      {onDelete && (
        <Button
          type="button"
          variant="none"
          className="text-neutral"
          onClick={onDelete}
          aria-label={deleteLabel ?? `Delete tag ${name}`}
        >
          ✕
        </Button>
      )}
    </span>
  );
}

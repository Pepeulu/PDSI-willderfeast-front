"use client";

export default function FotoFeralUpload({
  arquivo,
  onChange,
  disabled,
}: {
  arquivo: File | null;
  onChange: (arquivo: File | null) => void;
  disabled: boolean;
}) {
  return (
    <fieldset className="feral-photo-upload" disabled={disabled}>
      <label className="feral-field">
        <span>Imagem</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const selecionado = e.currentTarget.files?.[0];
            if (selecionado) onChange(selecionado);
            e.currentTarget.value = "";
          }}
        />
      </label>
      <small>
        JPG, PNG ou WebP, até 4 MB. A foto é enviada ao salvar a ficha.
      </small>
      {arquivo && (
        <div className="feral-photo-selection">
          <span>{arquivo.name}</span>
          <button type="button" onClick={() => onChange(null)}>
            Remover foto selecionada
          </button>
        </div>
      )}
    </fieldset>
  );
}

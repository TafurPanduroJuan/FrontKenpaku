export function prepareQuoteImageExport(clonedDocument) {
  clonedDocument.querySelectorAll('[data-export-hide]').forEach((element) => element.remove());
  clonedDocument.querySelectorAll('[data-export-alternative]').forEach((element) => {
    element.textContent = `Alternativa disponible: ${element.dataset.exportAlternative}`;
    element.classList.remove('hidden');
  });
}

// src/hooks/useBackButton.js
// Intercepta botão físico "Voltar" do Android no PWA
// e navega para a rota anterior. Compatível com bottom sheets.

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * @param {Function} [onBack] - Callback opcional. Se retornar `true`,
 *   o hook NÃO navega — ideal para fechar bottom sheets antes de sair.
 *
 * Uso simples (sem sheet):
 *   useBackButton();
 *
 * Uso com sheet aberto:
 *   useBackButton(() => {
 *     if (sheetAberto) { fecharSheet(); return true; }
 *   });
 */
export function useBackButton(onBack) {
  const navigate = useNavigate();

  useEffect(() => {
    // Empurra um estado fantasma para podermos detectar o "voltar"
    window.history.pushState({ backGuard: true }, '');

    function handlePopState(e) {
      // Se o callback tratou (retornou true), reempurra o estado
      // para que o próximo "voltar" ainda seja interceptado
      if (onBack && onBack() === true) {
        window.history.pushState({ backGuard: true }, '');
        return;
      }
      // Nenhum sheet aberto — navega normalmente
      navigate(-1);
    }

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onBack, navigate]);
}
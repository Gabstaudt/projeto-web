
export function obterSessaoIdDoLocalStorage(): string {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      const dadosUsuario = JSON.parse(usuario);
      return dadosUsuario.SessaoID || ''; // Retorna o SessaoID, ou vazio se não existir
    }
    console.warn('Sessão ID não encontrada no localStorage.');
    return ''; // Retorna string vazia se não existir
  }

  
import { ShieldAlert } from 'lucide-react';

export default function AutoStartHelp() {
  return (
    <div className="flex-1 bg-white p-8 overflow-y-auto">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-[#104a9e] mb-6">O aplicativo não está iniciando automaticamente</h1>
        
        <p className="text-sm text-zinc-700 mb-4 font-semibold">
          Há alguns motivos que podem fazer o aplicativo não iniciar automaticamente:
        </p>
        
        <ul className="list-decimal list-inside text-sm text-zinc-700 mb-6 space-y-1">
          <li>O "Auto Iniciar" está desabilitado;</li>
          <li>A permissão de "Sobreposição sobre apps" está desabilitada;</li>
          <li>Está utilizando uma Smart TV da TCL;</li>
        </ul>
        
        <p className="text-sm text-zinc-700 mb-10">
          Veja abaixo as soluções mais comuns para esses e outros problemas similares onde o aplicativo não está iniciando automaticamente com o sistema.
        </p>

        {/* Topic 1 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-zinc-800 border-l-4 border-[#104a9e] pl-3 mb-4">
            1 - O "Auto Iniciar" está desabilitado
          </h2>
          <p className="text-sm text-zinc-700 mb-4">
            Por padrão a opção "Auto Iniciar" fica habilitada, mas pode ocorrer de ter desabilitado sem querer em algum momento que estava editando as configurações da TV.
          </p>
          <div className="bg-zinc-50 p-4 rounded border border-zinc-100">
            <h3 className="font-bold text-zinc-800 text-sm mb-1">Como habilitar o "Auto Iniciar"?</h3>
            <p className="text-sm text-zinc-700">
              Para habilitar o "Auto Iniciar", acesse a página desse aparelho clicando aqui, clique na aba <strong>Extras</strong> e depois ative a opção <strong>Auto Iniciar</strong>.
            </p>
          </div>
        </section>

        {/* Topic 2 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-zinc-800 border-l-4 border-[#104a9e] pl-3 mb-4">
            2 - A permissão de "Sobreposição sobre apps" está desabilitada
          </h2>
          <p className="text-sm text-zinc-700 mb-3">
            Na maioria dos aparelhos, quando iniciar o aplicativo nas primeiras vezes irá solicitar para que seja liberado todas permissões necessárias para o funcionamento adequado do aplicativo no sistema do aparelho.
          </p>
          <p className="text-sm text-zinc-700 mb-3">
            Em alguns desses aparelhos, essa permissão é a "Sobreposição sobre apps", geralmente essa permissão para ser liberada, é aberto uma janela que precisa apenas selecionar / marcar / habilitar o aplicativo nela e depois clicar em VOLTAR no controle remoto do aparelho.
          </p>
          <p className="text-sm text-zinc-700 mb-3">
            Se essa janela for aberta e você não habilitar o aplicativo nela e apenas clicar em VOLTAR no controle, o aplicativo tentará lhe pedir essa permissão por mais algumas vezes quando ele iniciar, se em todas as tentativas você não liberar essa permissão, será necessário liberar a permissão manualmente nas configurações do sistema.
          </p>
          <p className="text-sm text-zinc-700 mb-4">
            Em raros aparelhos, pode ocorrer de não ser aberto essa janela, precisando liberar a permissão manualmente nas configurações do sistema.
          </p>
          
          <div className="bg-zinc-50 p-4 rounded border border-zinc-100">
            <h3 className="font-bold text-zinc-800 text-sm mb-1">Como liberar essa permissão manualmente no sistema?</h3>
            <p className="text-sm text-zinc-700 mb-2">
              Para liberar essa permissão manualmente no sistema, acesse este caminho no sistema do Android (<strong>Configurações -&gt; Apps -&gt; Permissões Especiais -&gt; Sobreposição sobre apps</strong>) e habilite o aplicativo.
            </p>
            <p className="text-sm text-zinc-500 italic">
              Caso tenha dúvidas, contate o suporte.
            </p>
          </div>
        </section>

        {/* Topic 3 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-zinc-800 border-l-4 border-[#104a9e] pl-3 mb-4">
            3 - Está utilizando uma Smart TV da TCL
          </h2>
          <p className="text-sm text-zinc-700 mb-3">
            Na maioria das Smart TVs TCL, além de liberar todas as permissões necessárias, pode ser necessário liberar uma permissão adicional no aplicativo de segurança da TCL.
          </p>
          <p className="text-sm text-zinc-700 mb-4">
            Pra fazer isso, basta ir no aplicativo de segurança da TCL (geralmente é um aplicativo com ícone de escudo) e na opção de auto inicialização, deixe como ABERTO ou HABILITADO para o aplicativo.
          </p>
          
          <div className="flex items-start gap-2 bg-orange-50 border border-orange-100 p-3 rounded">
            <ShieldAlert className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-xs text-orange-800">
              * Em alguns casos raros, pode ocorrer de mesmo liberando tudo corretamente, ainda sim a Smart TV não iniciar o aplicativo automaticamente.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}

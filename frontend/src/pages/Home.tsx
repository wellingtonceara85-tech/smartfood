import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
      <h1 className="text-2xl font-bold text-gray-800">SmartFood</h1>
      <p className="max-w-sm text-gray-600">
        Acesse o cardápio da sua loja pelo link fornecido (ex: <code>/nome-da-loja</code>).
      </p>
      <Link
        to="/login"
        className="rounded-full bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700"
      >
        Sou lojista, quero entrar
      </Link>
    </div>
  );
}

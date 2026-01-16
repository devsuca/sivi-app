export default function Footer() {
  return (
    <footer className="p-4 bg-white dark:bg-gray-800 border-t text-center text-sm text-gray-500 dark:text-gray-400">
      © {new Date().getFullYear()} SIVIS+360º - Todos os direitos reservados.
    </footer>
  );
}

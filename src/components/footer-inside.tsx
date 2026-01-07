import Link from "next/link";

export function FooterInside() {
  return (
    <footer className="absolute bottom-0 flex justify-center items-center border-t w-screen h-s h-12">
          {/* Right side - Copyright */}
          <span className="text-base text-gray-500">
            © 2025 Certifikátor.
          </span>
    </footer>
  )
}
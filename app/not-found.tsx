import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center'>
      <div className='text-center'>
        <h1 className='text-6xl font-bold text-gray-800 dark:text-gray-200'>
          404
        </h1>
        <p className='text-2xl text-gray-600 dark:text-gray-400 mt-4'>
          Page not found
        </p>
        <p className='text-gray-500 dark:text-gray-500 mt-2'>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href='/'
          className='inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

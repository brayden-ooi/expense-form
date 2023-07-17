import ModalCard from 'components/ModalCard';
import { HOME_PATHS } from 'lib/constants/home';
import Head from 'next/head'
import Link from 'next/link';

const Home = () => {
  return (
    <>
      <Head>
        <title>Home</title>
        <meta name="description" content="Local Project Home" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="mt-10 sm:m-10" style={{ height: 'calc(100vh - 40px)' }}>
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-3">
            <div className="px-4 sm:px-0">
              <h2 className="text-xl font-medium leading-6 text-gray-900 text-center sm:text-left">Home</h2>
            </div>
          </div>

          <div className="mt-5 md:col-span-2 md:mt-0 bg-white rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center mt-1 w-full">
                Select item
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-6 text-center">
                {HOME_PATHS.map(({label, icon, path}) => (
                  <Link href={path} key={label}>
                    <ModalCard
                      handleSelect={() => {}}
                      isSelected={false}
                    >
                      <p className="text-2xl">{icon}</p>
                      <p className="text-xs mt-2">{label}</p>
                    </ModalCard>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

export default Home;
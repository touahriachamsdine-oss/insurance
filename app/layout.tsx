import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

// Root layout simply passes children to the localized layouts
export default function RootLayout({ children }: Props) {
  return children;
}

// Type shim to fix ReactNode type issues with Raycast API and TypeScript 5.3+
import "react";

declare module "react" {
  namespace React {
    // Override ReactNode to exclude Promise and bigint for JSX compatibility
    type ReactNode =
      | ReactElement
      | string
      | number
      | boolean
      | null
      | undefined
      | ReactFragment
      | ReactPortal;
  }
}

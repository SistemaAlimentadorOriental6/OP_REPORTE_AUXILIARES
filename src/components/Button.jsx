import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import PropTypes from 'prop-types'

import { cn } from "../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-semibold ring-offset-background transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive",
        outline: "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-input",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary",
        ghost: "hover:bg-accent hover:text-accent-foreground focus:ring-accent",
        link: "text-primary underline-offset-4 hover:underline focus:ring-primary",
        primary: "bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500",
        'secondary-custom': "bg-teal-100 text-teal-700 hover:bg-teal-200 focus:ring-teal-500",
        'outline-custom': "bg-transparent border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-50 focus:ring-emerald-500",
        'ghost-custom': "bg-transparent text-emerald-500 hover:bg-emerald-50 focus:ring-emerald-500"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 py-1 text-sm",
        lg: "h-11 rounded-md px-6 py-3 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  asChild = false,
  fullWidth = false,
  icon,
  children,
  ...props 
}, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(
        buttonVariants({ variant, size, className }),
        fullWidth ? 'w-full' : '',
        props.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
      )}
      ref={ref}
      {...props}
    >
      <div className="flex items-center justify-center">
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </div>
    </Comp>
  )
})

Button.displayName = "Button"

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf([
    'default', 'destructive', 'outline', 'secondary', 'ghost', 'link',
    'primary', 'secondary-custom', 'outline-custom', 'ghost-custom'
  ]),
  size: PropTypes.oneOf(['default', 'sm', 'lg', 'icon']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  icon: PropTypes.element,
  className: PropTypes.string,
  asChild: PropTypes.bool
}

// Change this line
export { Button, buttonVariants }
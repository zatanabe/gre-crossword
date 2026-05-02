export default [
  // Arithmetic & Number Properties
  { front: 'Order of operations', back: '\\text{PEMDAS: Parentheses, Exponents, Multiplication/Division, Addition/Subtraction}' },
  { front: 'Even + Even', back: '\\text{Even}' },
  { front: 'Odd + Odd', back: '\\text{Even}' },
  { front: 'Even + Odd', back: '\\text{Odd}' },
  { front: 'Even × Anything', back: '\\text{Even}' },
  { front: 'Odd × Odd', back: '\\text{Odd}' },
  { front: 'Sum of first $n$ positive integers', back: '\\frac{n(n+1)}{2}' },
  { front: 'Number of factors of a number', back: '\\text{If } n = p_1^{a} \\cdot p_2^{b} \\cdots \\text{, then } (a+1)(b+1)\\cdots' },
  { front: 'Divisibility rule for 3', back: '\\text{Sum of digits is divisible by 3}' },
  { front: 'Divisibility rule for 4', back: '\\text{Last two digits form a number divisible by 4}' },
  { front: 'Divisibility rule for 6', back: '\\text{Divisible by both 2 and 3}' },
  { front: 'Divisibility rule for 9', back: '\\text{Sum of digits is divisible by 9}' },

  // Fractions, Decimals, Percents
  { front: 'Percent change formula', back: '\\frac{\\text{New} - \\text{Original}}{\\text{Original}} \\times 100' },
  { front: 'Simple interest', back: 'I = Prt' },
  { front: 'Compound interest', back: 'A = P\\left(1 + \\frac{r}{n}\\right)^{nt}' },
  { front: 'Convert fraction to percent', back: '\\text{Divide numerator by denominator, multiply by 100}' },
  { front: '$\\frac{1}{8}$ as a decimal', back: '0.125' },
  { front: '$\\frac{1}{6}$ as a decimal', back: '0.1\\overline{6}' },
  { front: '$\\frac{5}{6}$ as a decimal', back: '0.8\\overline{3}' },

  // Ratios & Proportions
  { front: 'Work rate formula (combined)', back: '\\frac{1}{t} = \\frac{1}{a} + \\frac{1}{b}' },
  { front: 'Distance formula', back: 'd = rt \\quad \\text{(rate × time)}' },
  { front: 'Average speed for a round trip', back: '\\frac{2 \\cdot v_1 \\cdot v_2}{v_1 + v_2}' },

  // Exponents & Roots
  { front: '$a^m \\cdot a^n$', back: 'a^{m+n}' },
  { front: '$\\frac{a^m}{a^n}$', back: 'a^{m-n}' },
  { front: '$(a^m)^n$', back: 'a^{mn}' },
  { front: '$a^0$ where $a \\neq 0$', back: '1' },
  { front: '$a^{-n}$', back: '\\frac{1}{a^n}' },
  { front: '$\\sqrt{a} \\cdot \\sqrt{b}$', back: '\\sqrt{ab}' },
  { front: '$\\frac{\\sqrt{a}}{\\sqrt{b}}$', back: '\\sqrt{\\frac{a}{b}}' },
  { front: '$a^{1/n}$', back: '\\sqrt[n]{a}' },

  // Algebra
  { front: 'Quadratic formula', back: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
  { front: 'Difference of squares', back: 'a^2 - b^2 = (a+b)(a-b)' },
  { front: 'Perfect square trinomials', back: '(a \\pm b)^2 = a^2 \\pm 2ab + b^2' },
  { front: 'Sum of cubes', back: 'a^3 + b^3 = (a+b)(a^2 - ab + b^2)' },
  { front: 'Difference of cubes', back: 'a^3 - b^3 = (a-b)(a^2 + ab + b^2)' },
  { front: 'Discriminant and nature of roots', back: 'D = b^2 - 4ac \\begin{cases} D > 0 & \\text{2 real roots} \\\\ D = 0 & \\text{1 real root} \\\\ D < 0 & \\text{no real roots} \\end{cases}' },
  { front: 'Slope of a line', back: 'm = \\frac{y_2 - y_1}{x_2 - x_1}' },
  { front: 'Slope-intercept form', back: 'y = mx + b' },
  { front: 'Point-slope form', back: 'y - y_1 = m(x - x_1)' },
  { front: 'Parallel lines have...', back: '\\text{Equal slopes: } m_1 = m_2' },
  { front: 'Perpendicular lines have...', back: '\\text{Negative reciprocal slopes: } m_1 \\cdot m_2 = -1' },
  { front: 'Midpoint formula', back: '\\left(\\frac{x_1+x_2}{2}, \\frac{y_1+y_2}{2}\\right)' },
  { front: 'Distance between two points', back: 'd = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}' },

  // Inequalities & Absolute Value
  { front: 'When you multiply/divide an inequality by a negative...', back: '\\text{Flip the inequality sign}' },
  { front: '$|x| = a$ means...', back: 'x = a \\quad \\text{or} \\quad x = -a' },
  { front: '$|x| < a$ means...', back: '-a < x < a' },
  { front: '$|x| > a$ means...', back: 'x > a \\quad \\text{or} \\quad x < -a' },

  // Geometry
  { front: 'Area of a triangle', back: 'A = \\frac{1}{2}bh' },
  { front: 'Area of a circle', back: 'A = \\pi r^2' },
  { front: 'Circumference of a circle', back: 'C = 2\\pi r' },
  { front: 'Area of a trapezoid', back: 'A = \\frac{1}{2}(b_1 + b_2)h' },
  { front: 'Pythagorean theorem', back: 'a^2 + b^2 = c^2' },
  { front: 'Common Pythagorean triples', back: '3\\text{-}4\\text{-}5, \\quad 5\\text{-}12\\text{-}13, \\quad 8\\text{-}15\\text{-}17, \\quad 7\\text{-}24\\text{-}25' },
  { front: '45-45-90 triangle side ratios', back: '1 : 1 : \\sqrt{2}' },
  { front: '30-60-90 triangle side ratios', back: '1 : \\sqrt{3} : 2' },
  { front: 'Sum of interior angles of a polygon', back: '(n-2) \\times 180°' },
  { front: 'Each interior angle of a regular polygon', back: '\\frac{(n-2) \\times 180°}{n}' },
  { front: 'Arc length', back: 'L = \\frac{\\theta}{360°} \\times 2\\pi r' },
  { front: 'Area of a sector', back: 'A = \\frac{\\theta}{360°} \\times \\pi r^2' },
  { front: 'Volume of a cylinder', back: 'V = \\pi r^2 h' },
  { front: 'Surface area of a cylinder', back: 'SA = 2\\pi r^2 + 2\\pi rh' },
  { front: 'Volume of a sphere', back: 'V = \\frac{4}{3}\\pi r^3' },
  { front: 'Surface area of a sphere', back: 'SA = 4\\pi r^2' },
  { front: 'Volume of a cone', back: 'V = \\frac{1}{3}\\pi r^2 h' },
  { front: 'Volume of a rectangular solid', back: 'V = lwh' },
  { front: 'Diagonal of a rectangular solid', back: 'd = \\sqrt{l^2 + w^2 + h^2}' },
  { front: 'Equation of a circle', back: '(x-h)^2 + (y-k)^2 = r^2' },

  // Statistics
  { front: 'Mean (average)', back: '\\bar{x} = \\frac{\\sum x_i}{n}' },
  { front: 'Median', back: '\\text{Middle value when data is ordered (average of two middle values if } n \\text{ is even)}' },
  { front: 'Mode', back: '\\text{Most frequently occurring value}' },
  { front: 'Range', back: '\\text{Maximum} - \\text{Minimum}' },
  { front: 'Standard deviation (conceptual)', back: '\\sigma = \\sqrt{\\frac{\\sum(x_i - \\bar{x})^2}{n}} \\quad \\text{Measures spread from the mean}' },
  { front: 'Weighted average', back: '\\frac{w_1x_1 + w_2x_2 + \\cdots}{w_1 + w_2 + \\cdots}' },
  { front: 'Normal distribution: 68-95-99.7 rule', back: '\\text{68\\% within } 1\\sigma, \\quad \\text{95\\% within } 2\\sigma, \\quad \\text{99.7\\% within } 3\\sigma' },

  // Counting & Probability
  { front: 'Fundamental counting principle', back: '\\text{If event A has } m \\text{ outcomes and B has } n\\text{, total outcomes: } m \\times n' },
  { front: 'Permutation formula', back: 'P(n,r) = \\frac{n!}{(n-r)!}' },
  { front: 'Combination formula', back: 'C(n,r) = \\binom{n}{r} = \\frac{n!}{r!(n-r)!}' },
  { front: 'Probability of event A', back: 'P(A) = \\frac{\\text{favorable outcomes}}{\\text{total outcomes}}' },
  { front: 'P(A or B)', back: 'P(A) + P(B) - P(A \\text{ and } B)' },
  { front: 'P(A and B) if independent', back: 'P(A) \\times P(B)' },
  { front: 'P(not A)', back: '1 - P(A)' },

  // Number Theory
  { front: 'LCM × GCD of two numbers', back: '\\text{LCM}(a,b) \\times \\text{GCD}(a,b) = a \\times b' },
  { front: 'Remainder when dividing by 10', back: '\\text{Units digit of the number}' },
  { front: 'Number of integers from $a$ to $b$ inclusive', back: 'b - a + 1' },
  { front: 'Sum of consecutive integers from $a$ to $b$', back: '\\frac{(b-a+1)(a+b)}{2}' },
  { front: 'Evenly spaced set: mean equals median equals...', back: '\\frac{\\text{first term} + \\text{last term}}{2}' },
]

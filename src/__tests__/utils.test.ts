/**
 * Basic utility function tests to verify Jest setup
 */

describe('Utility Functions', () => {
  describe('formatDate', () => {
    test('should format date correctly', () => {
      const date = new Date('2024-01-01T12:00:00Z')
      const formatted = date.toLocaleDateString('ko-KR')
      expect(formatted).toBeTruthy()
    })
  })

  describe('Math operations', () => {
    test('should add numbers correctly', () => {
      expect(2 + 2).toBe(4)
    })

    test('should handle percentage calculations', () => {
      const total = 100
      const completed = 75
      const percentage = (completed / total) * 100
      expect(percentage).toBe(75)
    })
  })

  describe('String operations', () => {
    test('should format Korean text correctly', () => {
      const text = '안녕하세요'
      expect(text.length).toBe(5)
      expect(text).toContain('안녕')
    })

    test('should handle empty strings', () => {
      const empty = ''
      expect(empty).toBe('')
      expect(empty.length).toBe(0)
    })
  })

  describe('Array operations', () => {
    test('should filter arrays correctly', () => {
      const numbers = [1, 2, 3, 4, 5]
      const evenNumbers = numbers.filter(n => n % 2 === 0)
      expect(evenNumbers).toEqual([2, 4])
    })

    test('should map arrays correctly', () => {
      const names = ['김철수', '이영희']
      const greetings = names.map(name => `안녕하세요, ${name}님!`)
      expect(greetings).toEqual(['안녕하세요, 김철수님!', '안녕하세요, 이영희님!'])
    })
  })
})
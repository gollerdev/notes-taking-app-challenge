from django.test import TestCase
from parameterized import parameterized

from apps.authentication.models import User
from apps.authentication.repositories import UserRepository
from apps.authentication.tests.factories import UserFactory


class UserRepositoryCreateUserTest(TestCase):
    def test_creates_user_with_hashed_password(self):
        user = UserRepository.create_user(
            email="test@example.com", password="securepass123"
        )

        self.assertIsInstance(user, User)
        self.assertEqual(user.email, "test@example.com")
        self.assertTrue(user.check_password("securepass123"))
        self.assertNotEqual(user.password, "securepass123")
        self.assertTrue(User.objects.filter(email="test@example.com").exists())

    def test_persists_user_to_database(self):
        user = UserRepository.create_user(
            email="persist@example.com", password="securepass123"
        )
        fetched = User.objects.get(pk=user.pk)

        self.assertEqual(fetched.email, "persist@example.com")

    @parameterized.expand(
        [
            ("none_email", None, "password123", TypeError),
            ("int_email", 123, "password123", TypeError),
            ("empty_email", "", "password123", ValueError),
            ("none_password", "test@example.com", None, TypeError),
            ("int_password", "test@example.com", 123, TypeError),
            ("empty_password", "test@example.com", "", ValueError),
        ]
    )
    def test_invalid_params_raise(self, _name, email, password, expected_exc):
        with self.assertRaises(expected_exc):
            UserRepository.create_user(email=email, password=password)


class UserRepositoryGetByEmailTest(TestCase):
    def test_returns_user_when_found(self):
        created = UserFactory(email="found@example.com")
        result = UserRepository.get_by_email("found@example.com")

        self.assertIsNotNone(result)
        self.assertEqual(result.pk, created.pk)

    def test_returns_none_when_not_found(self):
        result = UserRepository.get_by_email("missing@example.com")
        self.assertIsNone(result)

    @parameterized.expand(
        [
            ("none_email", None, TypeError),
            ("int_email", 123, TypeError),
            ("empty_email", "", ValueError),
        ]
    )
    def test_invalid_params_raise(self, _name, email, expected_exc):
        with self.assertRaises(expected_exc):
            UserRepository.get_by_email(email=email)


class UserManagerCreateUserTest(TestCase):
    def test_create_user_empty_email_raises_value_error(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password="securepass123")

    def test_create_user_none_email_raises_value_error(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email=None, password="securepass123")


class UserManagerCreateSuperuserTest(TestCase):
    def test_create_superuser_success(self):
        user = User.objects.create_superuser(
            email="admin@example.com", password="adminpass123"
        )
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertEqual(user.email, "admin@example.com")

    def test_create_superuser_not_staff_raises(self):
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email="admin@example.com",
                password="adminpass123",
                is_staff=False,
            )

    def test_create_superuser_not_superuser_raises(self):
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email="admin@example.com",
                password="adminpass123",
                is_superuser=False,
            )


class UserStrTest(TestCase):
    def test_str_returns_email(self):
        user = UserFactory(email="str@example.com")
        self.assertEqual(str(user), "str@example.com")

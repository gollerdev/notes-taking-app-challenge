from django.test import TestCase
from parameterized import parameterized

from apps.authentication.models import User
from apps.authentication.tests.factories import UserFactory
from apps.notes.repositories import NoteRepository
from apps.notes.tests.factories import NoteFactory


class NoteModelStrTest(TestCase):
    def test_str_returns_title(self):
        note = NoteFactory.build(title="My Test Note")

        self.assertEqual(str(note), "My Test Note")


class NoteRepositoryGetByUserTest(TestCase):
    def test_returns_only_user_notes(self):
        user = UserFactory()
        other_user = UserFactory()
        NoteFactory.create_batch(3, owner=user)
        NoteFactory.create_batch(2, owner=other_user)

        result = NoteRepository.get_by_user(user)

        self.assertEqual(result.count(), 3)
        self.assertTrue(all(n.owner == user for n in result))

    def test_excludes_notes_from_other_users(self):
        user = UserFactory()
        other_user = UserFactory()
        NoteFactory.create_batch(2, owner=other_user)

        result = NoteRepository.get_by_user(user)

        self.assertEqual(result.count(), 0)

    def test_excludes_soft_deleted_notes(self):
        user = UserFactory()
        NoteFactory(owner=user, is_deleted=True)
        active = NoteFactory(owner=user, is_deleted=False)

        result = NoteRepository.get_by_user(user)

        self.assertQuerySetEqual(result, [active])

    @parameterized.expand(
        [
            ("none_user", None, TypeError),
            ("string_user", "not a user", TypeError),
            ("unsaved_user", User(), ValueError),
        ]
    )
    def test_invalid_user_raises(self, _name, user, expected_exc):
        with self.assertRaises(expected_exc):
            NoteRepository.get_by_user(user)


class NoteRepositoryCreateTest(TestCase):
    def test_creates_note_with_correct_fields(self):
        user = UserFactory()
        data = {"title": "Test Title", "body": "Test body", "category": "school"}

        note = NoteRepository.create(data, owner=user)

        self.assertEqual(note.title, "Test Title")
        self.assertEqual(note.body, "Test body")
        self.assertEqual(note.category, "school")
        self.assertEqual(note.owner, user)
        self.assertIsNotNone(note.pk)

    @parameterized.expand(
        [
            ("none_data", None, "valid", TypeError),
            ("string_data", "not a dict", "valid", TypeError),
            ("list_data", [], "valid", TypeError),
            ("empty_dict", {}, "valid", ValueError),
            ("none_owner", {"title": "T"}, None, TypeError),
            ("string_owner", {"title": "T"}, "not a user", TypeError),
            ("unsaved_owner", {"title": "T"}, User(), ValueError),
        ]
    )
    def test_invalid_params_raise(self, _name, data, owner, expected_exc):
        if owner == "valid":
            owner = UserFactory()
        with self.assertRaises(expected_exc):
            NoteRepository.create(data, owner=owner)


class NoteRepositoryUpdateTest(TestCase):
    def test_updates_only_provided_fields(self):
        note = NoteFactory()
        original_body = note.body

        updated = NoteRepository.update(note, {"title": "New Title"})

        self.assertEqual(updated.title, "New Title")
        self.assertEqual(updated.body, original_body)

    def test_updated_at_is_refreshed(self):
        note = NoteFactory()
        original_updated_at = note.updated_at

        updated = NoteRepository.update(note, {"title": "Changed"})

        self.assertGreaterEqual(updated.updated_at, original_updated_at)

    @parameterized.expand(
        [
            ("none_note", None, {"title": "T"}, TypeError),
            ("string_note", "not a note", {"title": "T"}, TypeError),
            ("none_data", "valid_note", None, TypeError),
            ("string_data", "valid_note", "not a dict", TypeError),
            ("list_data", "valid_note", [], TypeError),
            ("empty_dict", "valid_note", {}, ValueError),
        ]
    )
    def test_invalid_params_raise(self, _name, note, data, expected_exc):
        if note == "valid_note":
            note = NoteFactory()
        with self.assertRaises(expected_exc):
            NoteRepository.update(note, data)
